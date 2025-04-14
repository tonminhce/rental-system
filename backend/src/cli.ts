import { CommandModule } from './command.module';
import { CommandFactory } from 'nest-commander';
async function bootstrap() {
  await CommandFactory.run(CommandModule, {
    logger: ['error', 'warn'],
  });
}

bootstrap();
