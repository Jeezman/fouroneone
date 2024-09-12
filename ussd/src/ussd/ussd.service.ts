import { Injectable } from '@nestjs/common';
import * as africastalking from 'africastalking';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import { User } from 'src/user/entities/user.entity';
import { UserService } from 'src/user/user.service';
import { fetchOfferings } from 'src/utils/tbd';
import axios from 'axios';

@Injectable()
export class UssdService {
  private africasTalking: any;
  private sessionStore: Record<string, any> = {}; // In-memory store for sessions

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
    let response = '';

    // Ensure session store has an entry for the sessionId
    if (!this.sessionStore[sessionId]) {
      this.sessionStore[sessionId] = {
        providerUri: null,
        storedOfferings: [],
        currentPage: 1, // Track current page of offerings
      };
    }

    const parts = text.split('*');
    const mainOption = parts[0]; // Main menu option
    const offeringOption = parts[1]; // Selected offering or next/previous

    let user = await this.userRepository.findOne({ where: { phoneNumber } });

    // If user doesn't exist, create one
    if (!user) {
      try {
        user = await this.userService.create({
          phoneNumber,
          sessionId,
        });
      } catch (error) {
        return 'END There was an error processing your request. Please try again later.';
      }
    }

    switch (mainOption) {
      case '':
        // Main menu options
        response = `CON Welcome ${user.phoneNumber}. Select a provider to view offerings: \n1. AquaFinance Capital \n2. SwiftLiquidity Solutions \n3. Flowback Financial \n4. Vertex Liquid Assets \n5. Titanium Trust`;
        break;

      case '1':
      case '2':
      case '3':
      case '4':
      case '5':
        // Fetch offerings based on provider selection
        const providerIndex = parseInt(mainOption) - 1;
        const providerNames = [
          'AquaFinance Capital',
          'SwiftLiquidity Solutions',
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

              // Extract name from phone number (using phone number as the name)
              const customerName = phoneNumber;
              // Extract country code from phone number (assuming E.164 format like +234XXXXXXXXX)
              const countryCode = phoneNumber.substring(0, 4); // Adjust this according to the actual phone format
              // Fetch customer DID from user entity
              const customerDID = user.did;

              try {
                const result = await axios.get(
                  `https://mock-idv.tbddev.org/kcc?name=${customerName}&country=${countryCode}&did=${customerDID}`,
                );

                // Display the result to the user
                const { data } = result;
                response = `END You selected: ${selectedOffering.data.description}. Verification Result: ${data.message}. Thank you for using our service.`;
              } catch (error) {
                response =
                  'END Error fetching verification result. Please try again later.';
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
