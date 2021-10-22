import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type MigrationDocument = Migration & Document;

@Schema({ timestamps: true })
export class Migration {
  @Prop({ required: true })
  amount: number;

  @Prop({ required: true })
  sender: string;

  @Prop({ required: true })
  receiver: string;

  @Prop({ requried: true })
  fromChain: number;

  @Prop({ requried: true })
  toChain: number;

  @Prop({ requried: true })
  fromHash: string;

  @Prop()
  toHash: string;

  @Prop({ requried: true })
  nonce: number;

  @Prop({ requried: true })
  signature: string;

  @Prop({ required: true })
  migrationID: string;

  @Prop({ required: true })
  isMigrated: boolean;
}

export const MigrationSchema = SchemaFactory.createForClass(Migration);
