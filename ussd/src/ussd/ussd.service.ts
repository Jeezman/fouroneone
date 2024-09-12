import { Injectable } from '@nestjs/common';
import * as africastalking from 'africastalking';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import { User } from 'src/user/entities/user.entity';
import { UserService } from 'src/user/user.service';
import { fetchOfferings } from 'src/utils/tbd';

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
    console.log('Processing USSD request...');
    console.log('Text:', text);
    console.log('Session ID:', sessionId);
    console.log('Phone Number:', phoneNumber);
    console.log('Network Code:', networkCode);

    let response = '';

    // Ensure session store has an entry for the sessionId
    if (!this.sessionStore[sessionId]) {
      this.sessionStore[sessionId] = {
        providerUri: null,
        storedOfferings: [],
      };
    }

    const parts = text.split('*');
    const mainOption = parts[0]; // Main option selected (PFI)
    const offeringOption = parts[1]; // Offering selection

    // Check if the user exists in the database
    let user = await this.userRepository.findOne({ where: { phoneNumber } });

    // If user doesn't exist, create a new user
    if (!user) {
      try {
        user = await this.userService.create({
          phoneNumber,
          sessionId,
        });
        console.log('New user created:', user);
      } catch (error) {
        console.log('Error creating user:', error);
        return 'END There was an error processing your request. Please try again later.';
      }
    }

    switch (mainOption) {
      case '':
        // First request. Start the response with CON
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
          // Fetch offerings using fetchOfferings function
          const offerings = await fetchOfferings();

          // Store all offerings in session
          this.sessionStore[sessionId].storedOfferings = offerings;

          if (!offeringOption) {
            // Display offering options if no offering is selected yet
            response = `CON You selected ${providerName}. \nSelect an offering to proceed:\n`;
            if (offerings.length === 0) {
              response = 'END No offerings available.';
            } else {
              offerings.forEach((offering: any, index: number) => {
                response += `${index + 1}. ${offering.data.description} \n`;
              });
            }
          } else {
            // User selected an offering
            const offeringIndex = parseInt(offeringOption) - 1;

            // Ensure offeringIndex is within the valid range
            if (
              offeringIndex >= 0 &&
              offeringIndex <
                this.sessionStore[sessionId].storedOfferings.length
            ) {
              const selectedOffering =
                this.sessionStore[sessionId].storedOfferings[offeringIndex];
              console.log('Selected Offering:', selectedOffering);
              response = `END You selected: ${selectedOffering.data.description}. Thank you for using our service.`;
              if (selectedOffering) {
                // Display selected offering and end session
                response = `END You selected: ${selectedOffering.data.description}. Thank you for using our service.`;
              } else {
                response = 'END Invalid offering selection. Please try again.';
              }
            } else {
              response = 'END Invalid offering selection. Please try again.';
            }
          }
        } catch (error) {
          console.log('Error fetching offerings:', error);
          response = 'END Error fetching offerings. Please try again later.';
        }
        break;

      default:
        // Handle invalid or unexpected input by returning an END message
        response = 'END Invalid option selected. Please try again.';
        break;
    }

    // Ensure that the response always starts with CON or END
    if (!response.startsWith('CON') && !response.startsWith('END')) {
      response = 'END Invalid response format.';
    }

    // Return the response
    return response;
  }
}
