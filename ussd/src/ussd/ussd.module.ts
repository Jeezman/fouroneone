import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';
import { UssdService } from './ussd.service';
import { UssdController } from './ussd.controller';
import { User } from 'src/user/entities/user.entity';
import { Ussd } from './entities/ussd.entity';
import { UserModule } from 'src/user/user.module';

@Module({
  imports: [
    UserModule,
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    TypeOrmModule.forFeature([User, Ussd]),
  ],
  controllers: [UssdController],
  providers: [UssdService],
})
export class UssdModule {}
