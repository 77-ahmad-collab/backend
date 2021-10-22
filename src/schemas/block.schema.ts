import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type BlockDocument = Block & Document;

@Schema({ timestamps: true })
export class Block {
  @Prop({ required: true })
  ethBlock: number;

  @Prop({ required: true })
  bnbBlock: number;

  // @Prop({ required: true })
  // matBlock: number;
}

export const BlockSchema = SchemaFactory.createForClass(Block);
