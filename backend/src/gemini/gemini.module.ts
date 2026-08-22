import { Module } from '@nestjs/common';
import { GeminiController } from './gemini.controller';

@Module({
  controllers: [GeminiController],
})
export class GeminiModule {}
