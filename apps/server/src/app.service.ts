import { Injectable } from '@nestjs/common';

@Injectable()
export class AppService {
  getHello(): string {
    return 'Hello World!';
  }

  health(): Promise<any> {
    return Promise.resolve({ message: 'The Server is Up and Running' });
  }
}
