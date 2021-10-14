import { Controller, Get, Param } from '@nestjs/common';
import { AppService } from './app.service';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  getHello(): string {
    return this.appService.getHello();
  }

  @Get('/claimStatus/:migrationID')
  async ClaimStatus(@Param('migrationID') migrationID: string) {
    return await this.appService.ClaimStatus(migrationID);
  }
}
