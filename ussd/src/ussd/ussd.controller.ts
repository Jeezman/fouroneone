import { Controller, Post, Body, Res } from '@nestjs/common';
import { UssdService } from './ussd.service';

@Controller('ussd')
export class UssdController {
  constructor(private readonly ussdService: UssdService) {}

  @Post()
  handleUssd(@Body() ussdBody: any, @Res() res) {
    const { text, sessionId, phoneNumber } = ussdBody;

    console.log('USSD Body:', ussdBody);

    const response = this.ussdService.processUssd(text, sessionId, phoneNumber);

    console.log('res is ', response);
    res.header('Content-Type', 'text/plain');
    return res.send(response);
  }
}
