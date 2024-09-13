import { Module } from '@nestjs/common';
import { RfqService } from './rfq.service';
import { RfqController } from './rfq.controller';

@Module({
  controllers: [RfqController],
  providers: [RfqService],
})
export class RfqModule {}
