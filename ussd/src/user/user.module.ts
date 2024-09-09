import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserService } from './user.service';
import { UserController } from './user.controller';
import { User } from './entities/user.entity';
import { Ussd } from 'src/ussd/entities/ussd.entity';

@Module({
  imports: [TypeOrmModule.forFeature([User, Ussd])],
  controllers: [UserController],
  providers: [UserService],
})
export class UserModule {}
