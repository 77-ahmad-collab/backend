import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { Block, BlockSchema } from './schemas/block.schema';
import { Migration, MigrationSchema } from './schemas/migration.schema';
import { ScheduleModule } from '@nestjs/schedule';
import { ThrottlerModule } from '@nestjs/throttler';

//Hi there

@Module({
  imports: [
    ThrottlerModule.forRoot({
      ttl: 5,
      limit: 60,
    }),
    ConfigModule.forRoot(),
    ScheduleModule.forRoot(),
    MongooseModule.forRoot(process.env.MONGO_URL),
    MongooseModule.forFeature([{ name: Block.name, schema: BlockSchema }]),
    MongooseModule.forFeature([
      { name: Migration.name, schema: MigrationSchema },
    ]),
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
