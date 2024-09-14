import { Controller, Post, Body, Res, Logger } from '@nestjs/common';
import { UssdService } from './ussd.service';

@Controller('ussd')
export class UssdController {
  constructor(private ussdService: UssdService) {}
  private readonly logger = new Logger(UssdController.name);

  @Post()
  async handleUssd(@Body() ussdBody: any, @Res() res) {
    const { text, sessionId, phoneNumber, networkCode } = ussdBody;

    const response = await this.ussdService.processUssd(
      text,
      sessionId,
      phoneNumber,
      networkCode,
    );
    res.header('Content-Type', 'text/plain');
    return res.send(response);
  }
}
