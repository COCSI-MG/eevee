import { Test, TestingModule } from '@nestjs/testing';
import { THROTTLER_SKIP } from '@nestjs/throttler/dist/throttler.constants';
import { AppController } from './app.controller';
import { AppService } from './app.service';

describe('AppController', () => {
  let appController: AppController;

  beforeEach(async () => {
    const app: TestingModule = await Test.createTestingModule({
      controllers: [AppController],
      providers: [AppService],
    }).compile();

    appController = app.get<AppController>(AppController);
  });

  describe('root', () => {
    it('should return the current health status', () => {
      expect(appController.getHealth()).toBe('All systems online!');
    });

    it('skips throttling for health checks', () => {
      expect(
        Reflect.getMetadata(THROTTLER_SKIP + 'default', AppController.prototype.getHealth),
      ).toBe(true);
    });
  });
});
