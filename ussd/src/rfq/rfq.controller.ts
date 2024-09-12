import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { RfqService } from './rfq.service';
import { CreateRfqDto } from './dto/create-rfq.dto';
import { UpdateRfqDto } from './dto/update-rfq.dto';

@Controller('rfq')
export class RfqController {
  constructor(private readonly rfqService: RfqService) {}

  @Post()
  create(@Body() createRfqDto: CreateRfqDto) {
    return this.rfqService.create(createRfqDto);
  }

  @Get()
  findAll() {
    return this.rfqService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.rfqService.findOne(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateRfqDto: UpdateRfqDto) {
    return this.rfqService.update(+id, updateRfqDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.rfqService.remove(+id);
  }
}
