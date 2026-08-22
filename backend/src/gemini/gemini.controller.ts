import { Controller, Post, Body, Res, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { Response } from 'express';

@ApiTags('مساعد الذكاء الاصطناعي - Gemini AI Proxy')
@Controller('gemini')
export class GeminiController {
  @Post('chat')
  @ApiOperation({ summary: 'بوابة المساعد الذكي الآمنة لـ Gemini' })
  async chat(@Body() body: any, @Res() res: Response) {
    const apiKey = process.env.GEMINI_API_KEY || "AIzaSyC2KWJfMIQ3YZv9r-Ejp9hBWv3UYkkY_7M";
    const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;

    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(body)
      });

      if (!response.ok) {
        return res.status(response.status).json({
          error: `Gemini API returned status ${response.status}`,
          success: false
        });
      }

      const resData = await response.json();
      return res.status(HttpStatus.OK).json(resData);
    } catch (err) {
      console.error('[GeminiProxy] Fetch error:', err.message);
      return res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
        error: 'خطأ داخلي أثناء معالجة الطلب في بوابة الذكاء الاصطناعي',
        success: false
      });
    }
  }
}
