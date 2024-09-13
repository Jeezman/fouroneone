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

    // Ensure session store has an entry for the sessionId
    if (!this.sessionStore[sessionId]) {
      this.sessionStore[sessionId] = {
        providerUri: null,
        storedOfferings: [],
        currentPage: 1, // Track current page of offerings
      };
      // this.logger.log('Set session store entry: ', this.sessionStore);
    }

    const parts = text.split('*');
    const mainOption = parts[0]; // Main menu option
    const offeringOption = parts[1]; // Selected offering or next/previous

    let user = await this.userRepository.findOne({ where: { phoneNumber } });
    // this.logger.log(`Get user: ${JSON.stringify(user, null, 2)}`);

    // If user doesn't exist, create one
    if (!user) {
      // this.logger.log('User does not exist. Create user...');
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
        // Fetch offerings based on provider selection
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
                response += `0. Previous \n`; // Always display Previous as 0
              }
            }
          } else {
            // Offering selection
            const offeringIndex = parseInt(offeringOption) - 1;

            if (
              offeringIndex >= 0 &&
              offeringIndex <
                this.sessionStore[sessionId].storedOfferings.length
            ) {
              const selectedOffering =
                this.sessionStore[sessionId].storedOfferings[offeringIndex];

              // Ask the user to input the amount they wish to transfer
              if (!parts[2]) {
                response = `CON You selected: ${selectedOffering.data.description}. Enter the amount you wish to transfer:`;
              } else {
                const amount = parseFloat(parts[2]).toString(); // User input amount

                // Extract name from phone number (using phone number as the name)
                const customerName = phoneNumber;
                // Extract country code from phone number (assuming E.164 format like +234XXXXXXXXX)
                const countryCode = phoneNumber.substring(0, 4); // Adjust this according to the actual phone format
                // Fetch customer DID from user entity
                const customerDID = user.did;
                const pfiDID =
                  this.sessionStore[sessionId].storedOfferings[offeringIndex]
                    .metadata.from;
                console.log('customer did', customerDID);
                console.log('customer name ', customerName);
                console.log('country code ', countryCode);
                try {
                  const result = await requestVc({
                    name: customerName,
                    country: countryCode, // TODO: Use the actual country code
                    did: customerDID.uri,
                  });
                  // Display the result to the user
                  const { data } = result;

                  const verification = await selectCredentials(
                    [data],
                    selectedOffering.data.requiredClaims,
                  );

                  // Call createRfq with the required parameters including the amount
                  const rfqResult = await createRfq(
                    pfiDID,
                    customerDID,
                    selectedOffering,
                    verification,
                    amount, // Pass the input amount here
                  );

                  response = `END Your RFQ has been created successfully for ${amount} units. Thank you for using our service.`;
                } catch (error) {
                  response =
                    'END Error fetching verification or creating RFQ. Please try again later.';
                }
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
