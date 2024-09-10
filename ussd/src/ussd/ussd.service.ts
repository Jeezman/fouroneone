import { Injectable } from '@nestjs/common';
import * as africastalking from 'africastalking';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import { User } from 'src/user/entities/user.entity';

@Injectable()
export class UssdService {
  private africasTalking: any;

  constructor(
    private configService: ConfigService,
    @InjectRepository(User) private userRepository: Repository<User>,
  ) {
    this.africasTalking = africastalking({
      apiKey: this.configService.get<string>('AFRICASTALKING_API_KEY'),
      username: this.configService.get<string>('AFRICASTALKING_USERNAME'),
    });
  }

  // Process USSD requests

  processUssd(text: string, sessionId: string, phoneNumber: string) {
    console.log(text, sessionId, phoneNumber);
    let response = '';

    console.log('process ussd ', { text, sessionId, phoneNumber });

    switch (text) {
      case '':
        // First request. Start the response with CON
        response =
          'CON What would you like to check? \n1. My account \n2. My phone number';
        break;
      case '1':
        // Business logic for first-level response
        response =
          'CON Choose account information you want to view: \n1. Account number';
        break;
      case '2':
        // Terminal request. Start the response with END
        response = `END Your phone number is ${phoneNumber}`;
        break;
      case '1*1':
        // Second-level response where the user selected 1 in the first instance
        const accountNumber = 'ACC100101';
        response = `END Your account number is ${accountNumber}`;
        break;
      default:
        // Handle unexpected input. End the session
        response = 'END Invalid selection. Please try again.';
    }
    // Ensure that the response always starts with CON or END
    if (!response.startsWith('CON') && !response.startsWith('END')) {
      response = 'END Invalid response format.';
    }
    // Return the response
    return response;
  }
}
