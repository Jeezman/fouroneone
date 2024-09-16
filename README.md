# Wallet Application

## Video Demonstration

Check out the video below for a brief demonstration of the Wallet Application:

[![Watch the video](https://img.youtube.com/vi/YOUR_VIDEO_ID/0.jpg)](https://youtube.com/shorts/nfav4ERFt7M?feature=share)

## Project Overview

The Wallet Application is designed to provide a seamless experience for users to manage currency exchanges and financial transactions. It leverages the tbDEX SDK for connecting to Participating Financial Institutions (PFIs) and integrates with Africastalking for USSD, SMS, and IVR interactions, ensuring accessibility for all users.

## Key Features

- **Cross-Border Currency Exchange:** Exchange currencies through connected PFIs.
- **USSD, SMS, and IVR Transactions:** Perform transactions via USSD codes, SMS, and IVR systems.
- **Decentralized Identifiers (DIDs) Management:** Secure management of customer DIDs and Verifiable Credentials.
- **Profitability:** Revenue through transaction fees, premium rates, and PFI partnerships.
- **Optionality:** Smart matching for the best exchange rates across PFIs.
- **Customer Satisfaction Tracking:** Collect and analyze feedback to enhance service quality.

## Platform Choice

The application will primarily target the web platform, with USSD, SMS, and IVR services catering to users who prefer or require mobile-based interactions.

## Architecture and Technology Stack

### Frontend

- **USSD, SMS, IVR:** Integrated via [Africastalking API](https://africastalking.com/).

### Backend

- **Node.js with [NestJS](https://nestjs.com/):** Handles API requests, user data management, and integrations.
- **Database:** [PostgreSQL](https://www.postgresql.org/) for storing user data, transactions, and feedback.

### SDK Integration

- **tbDEX SDK:** Connects to PFIs and manages DID interactions and currency exchanges.

### Africastalking Integration

- **USSD:** Initiate transactions and check balances using USSD codes.
- **SMS:** Send and receive transaction instructions or confirmations.
- **IVR:** Perform transactions using voice prompts.

### DID and Credential Management

- **Decentralized Identifiers (DIDs):** Manage and interact with DIDs securely.
- **Verifiable Credentials:** Fetch and manage credentials via Ultimate Identity.

### Profitability Strategies

- **Transaction Fees:** Charge a fee per transaction.
- **Premium Services:** Offer enhanced processing or rates for a premium.
- **Partnerships:** Collaborate with PFIs for revenue sharing.

### Optionality Handling

- **Smart Matching Engine:** Evaluate and select the best PFI offerings based on rates and fees.

### Customer Satisfaction

- **Feedback System:** Collect feedback post-transaction via SMS or IVR.
- **Analytics Dashboard:** Track and analyze satisfaction metrics.

## Implementation Plan

1. **Project Setup**
   - Set up NestJS with PostgreSQL for the backend.
   - Integrate tbDEX SDK.

2. **USSD, SMS, and IVR Integration**
   - Configure Africastalking SDK.
   - Design USSD/SMS menus and IVR flows.

3. **DID and Verifiable Credential Management**
   - Implement DID management.
   - Integrate with Ultimate Identity.

4. **Currency Exchange Workflow**
   - Develop API routes for PFIs via tbDEX SDK.
   - Implement best PFI offering selection.

5. **Profitability Features**
   - Implement fees and premium services.
   - Develop PFI partnership module.

6. **Customer Satisfaction Tracking**
   - Implement feedback collection.
   - Develop analytics dashboard.

7. **Testing and Deployment**
   - Conduct thorough testing.
   - Deploy on a cloud platform (Digital Ocean).
   - Set up GitHub repository with documentation.

## Setting Up the NestJS Application

### 1. Initialize the NestJS Project

1. **Create a new NestJS project:**

    ```bash
    git clone https://github.com/Jeezman/fouroneone
    ```

2. **Navigate into the project directory:**

    ```bash
    cd fouroneone
    ```

3. **Install required dependencies:**

    ```bash
    npm install install
    ```

4. **Set up the database configuration:**

   Create a `.env` file in the root of your project and add your PostgreSQL database credentials:

    ```dotenv
    DATABASE_HOST=localhost
    DATABASE_PORT=5432
    DATABASE_USERNAME=your_username
    DATABASE_PASSWORD=your_password
    DATABASE_NAME=wallet_app
    ```

5. **Configure TypeORM in your `app.module.ts`:**

    ```typescript
    import { Module } from '@nestjs/common';
    import { TypeOrmModule } from '@nestjs/typeorm';
    import { ConfigModule } from '@nestjs/config';

    @Module({
      imports: [
        ConfigModule.forRoot(),
        TypeOrmModule.forRoot({
          type: 'postgres',
          host: process.env.DATABASE_HOST,
          port: parseInt(process.env.DATABASE_PORT, 10),
          username: process.env.DATABASE_USERNAME,
          password: process.env.DATABASE_PASSWORD,
          database: process.env.DATABASE_NAME,
          autoLoadEntities: true,
          synchronize: true,
        }),
      ],
    })
    export class AppModule {}
    ```

6. **Create your entities, services, and controllers as needed.**

### 2. Implement the tbDEX SDK Integration

1. **Install the tbDEX SDK:**

    ```bash
    npm install tbdex-sdk
    ```

2. **Integrate tbDEX SDK into your NestJS application as needed for currency exchanges and DID management.**

## Configuring Africastalking

### 1. Create an Africastalking Account

1. **Sign up for an Africastalking account at [Africastalking](https://africastalking.com/).**
2. **After signing up, log in to your Africastalking dashboard.**
3. **Go to the 'Account Settings' and generate your API key.**

### 2. Set Up Africastalking Integration

1. **Install Africastalking SDK:**

    ```bash
    npm install africastalking
    ```

2. **Configure Africastalking in your application:**

    Create a new service or module for Africastalking integration:

    ```typescript
    import { Injectable } from '@nestjs/common';
    import * as Africastalking from 'africastalking';

    @Injectable()
    export class AfricastalkingService {
      private africastalking;

      constructor() {
        this.africastalking = Africastalking({
          apiKey: 'YOUR_API_KEY',
          username: 'YOUR_USERNAME',
        });
      }

      // Implement methods to interact with Africastalking API
    }
    ```

### 3. Create Callback URL

1. **In your Africastalking dashboard, navigate to the 'USSD' or 'SMS' settings, depending on your needs.**
2. **Provide your callback URL. This URL should point to an endpoint in your NestJS application that handles incoming messages or requests.**

    Example callback URL: `https://yourdomain.com/api/africastalking/callback`

3. **Implement the callback endpoint in your NestJS application:**

    ```typescript
    import { Controller, Post, Body } from '@nestjs/common';

    @Controller('api/africastalking')
    export class AfricastalkingController {
      @Post('callback')
      handleCallback(@Body() body: any) {
        // Process the incoming data from Africastalking
        console.log(body);
        return { success: true };
      }
    }
    ```

## Project Submission

- **GitHub Repository:** Host the project, including frontend, backend, and documentation.
- **README.md:** Overview, setup instructions, usage, and project details.
