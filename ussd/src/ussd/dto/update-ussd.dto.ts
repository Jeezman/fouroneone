import { PartialType } from '@nestjs/mapped-types';
import { CreateUssdDto } from './create-ussd.dto';

export class UpdateUssdDto extends PartialType(CreateUssdDto) {}
