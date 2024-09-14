import { Injectable } from '@nestjs/common';
import { CreateRfqDto } from './dto/create-rfq.dto';
import { UpdateRfqDto } from './dto/update-rfq.dto';

@Injectable()
export class RfqService {
  create(createRfqDto: CreateRfqDto) {
    return 'This action adds a new rfq';
  }

  findAll() {
    return `This action returns all rfq`;
  }

  findOne(id: number) {
    return `This action returns a #${id} rfq`;
  }

  update(id: number, updateRfqDto: UpdateRfqDto) {
    return `This action updates a #${id} rfq`;
  }

  remove(id: number) {
    return `This action removes a #${id} rfq`;
  }
}
