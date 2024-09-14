import { Injectable, Logger } from '@nestjs/common';
import * as africastalking from 'africastalking';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import { User } from 'src/user/entities/user.entity';
import { UserService } from 'src/user/user.service';
import { fetchOfferings, createRfq } from 'src/utils/tbd';
import { requestVc, selectCredentials } from 'src/utils/vc';

@Injectable()
export class UssdService {
  private africasTalking: any;
  private sessionStore: Record<string, any> = {}; // In-memory store for sessions
  private readonly logger = new Logger(UssdService.name);

  constructor(
    private configService: ConfigService,
    private userService: UserService,
    @InjectRepository(User) private userRepository: Repository<User>,
  ) {
    this.africasTalking = africastalking({
      apiKey: this.configService.get<string>('AFRICASTALKING_API_KEY'),
      username: this.configService.get<string>('AFRICASTALKING_USERNAME'),
    });
  }
  async processUssd(
    text: string,
    sessionId: string,
    phoneNumber: string,
    networkCode: string,
  ) {
    this.logger.log('Received USSD request: ', {
      text,
      sessionId,
      phoneNumber,
      networkCode,
    });

    let response = '';

    if (!this.sessionStore[sessionId]) {
      this.sessionStore[sessionId] = {
        providerUri: null,
        storedOfferings: [],
        currentPage: 1,
        credentialData: {},
        credentialConfirmed: false,
        rfqConfirmation: null, // Field to track RFQ confirmation
      };
    }

    const parts = text.split('*');
    const mainOption = parts[0];
    const offeringOption = parts[1];
    const amount = parts[2];
    const credentialStep = parts[3];
    const credentialConfirmed = parts[4];
    const rfqConfirmation = parts[5];

    let user = await this.userRepository.findOne({ where: { phoneNumber } });

    if (!user) {
      try {
        user = await this.userService.create({
          phoneNumber,
          sessionId,
        });
      } catch (error) {
        this.logger.error('Error creating user: ', error);
        return 'END There was an error processing your request. Please try again later.';
      }
    }

    switch (mainOption) {
      case '':
        // Main menu options
        response = `CON Welcome ${user.phoneNumber}. Select a provider to view offerings: \n1. AquaFinance Capital \n2. Flowback Financial \n3. Vertex Liquid Assets \n4. Titanium Trust`;
        break;

      case '1':
      case '2':
      case '3':
      case '4':
        const providerIndex = parseInt(mainOption) - 1;
        const providerNames = [
          'AquaFinance Capital',
          'Flowback Financial',
          'Vertex Liquid Assets',
          'Titanium Trust',
        ];
        const providerName = providerNames[providerIndex];

        try {
          const offerings = await fetchOfferings();
          this.sessionStore[sessionId].storedOfferings = offerings;

          const itemsPerPage = 4;
          const currentPage = this.sessionStore[sessionId].currentPage;
          const totalPages = Math.ceil(offerings.length / itemsPerPage);

          if (!offeringOption) {
            const startIndex = (currentPage - 1) * itemsPerPage;
            const endIndex = Math.min(
              startIndex + itemsPerPage,
              offerings.length,
            );
            const currentOfferings = offerings.slice(startIndex, endIndex);

            response = `CON You selected ${providerName}. \nSelect an offering to proceed:\n`;
            if (offerings.length === 0) {
              response = 'END No offerings available.';
            } else {
              currentOfferings.forEach((offering: any, index: number) => {
                response += `${startIndex + index + 1}. ${offering.data.description} \n`;
              });

              if (currentPage < totalPages) {
                response += `${endIndex + 1}. Next \n`;
              }
              if (currentPage > 1) {
                response += `0. Previous \n`;
              }
            }
          } else {
            const offeringIndex = parseInt(offeringOption) - 1;

            if (
              offeringIndex >= 0 &&
              offeringIndex <
                this.sessionStore[sessionId].storedOfferings.length
            ) {
              const selectedOffering =
                this.sessionStore[sessionId].storedOfferings[offeringIndex];

              // Ask the user to input the amount they wish to transfer
              if (!amount) {
                response = `CON You selected: ${selectedOffering.data.description}. Enter the amount you wish to transfer:`;
              } else if (!credentialStep) {
                // Step: Ask for credential creation (first name)
                response = `CON Enter your full name to create your credentials:`;
              } else if (!this.sessionStore[sessionId].credentialData.name) {
                this.sessionStore[sessionId].credentialData.name =
                  credentialStep;

                // Step: Ask to confirm credential selection
                response = `CON Would you like to proceed with credential selection?\n1. Yes\n2. No`;
              } else if (!credentialConfirmed) {
                response = `CON Please confirm credential selection:\n1. Yes\n2. No`;
              } else if (credentialConfirmed === '1') {
                // Proceed with credential selection
                const customerName = `${this.sessionStore[sessionId].credentialData.firstName} ${this.sessionStore[sessionId].credentialData.lastName}`;
                const customerDID = user.did;

                // Extract country code from phone number
                const countryCode = phoneNumber.substring(0, 4);

                try {
                  // New step for credential selection with country code
                  const result = await requestVc({
                    name: customerName,
                    country: countryCode,
                    did: customerDID.uri,
                  });

                  const { data } = result;

                  // Separate credential selection step
                  const verification = await selectCredentials(
                    [data],
                    selectedOffering.data.requiredClaims,
                  );

                  // Store the verification in session for later use
                  this.sessionStore[sessionId].verification = verification;

                  // Store the selected credentials for future steps
                  this.sessionStore[sessionId].credentialConfirmed = true;

                  // Step: Ask to create RFQ
                  response = `CON Credentials confirmed. Would you like to create an RFQ for ${amount} units?\n1. Yes\n2. No`;
                } catch (error) {
                  response =
                    'END Error selecting credentials. Please try again later.';
                }
              } else if (rfqConfirmation === '1') {
                // Proceed with RFQ creation
                // Retrieve the stored verification object from session
                const verification = this.sessionStore[sessionId].verification;
                const pfiDID =
                  this.sessionStore[sessionId].storedOfferings[offeringIndex]
                    .metadata.from;

                try {
                  const rfqResult = await createRfq(
                    pfiDID,
                    user.did,
                    selectedOffering,
                    verification,
                    amount,
                  );

                  response = `END Your Tx for ${amount} units - Status: ${rfqResult.transactionStatus.reasonForClose}. \nThank you for using our service.`;
                } catch (error) {
                  response = 'END Error creating RFQ. Please try again later.';
                }
              } else if (rfqConfirmation === '2') {
                // User chose to cancel RFQ creation
                response = `END RFQ creation has been cancelled. Thank you for using our service.`;
              } else {
                response = `END Invalid choice. Please try again.`;
              }
            } else {
              response = 'END Invalid offering selection. Please try again.';
            }
          }
        } catch (error) {
          response = 'END Error fetching offerings. Please try again later.';
        }
        break;

      default:
        response = 'END Invalid option selected. Please try again.';
        break;
    }

    if (!response.startsWith('CON') && !response.startsWith('END')) {
      response = 'END Invalid response format.';
    }

    return response;
  }
}
