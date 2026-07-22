import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';

import { validateEnv } from './config/env.validation';
import { PrismaModule } from './prisma/prisma.module';
import { JwtAuthGuard } from './common/guards/jwt-auth.guard';
import { RolesGuard } from './common/guards/roles.guard';
import { AppController } from './app.controller';

import { AuthModule } from './auth/auth.module';
import { ContentModule } from './content/content.module';
import { SettingsModule } from './settings/settings.module';
import { HomeContentModule } from './home-content/home-content.module';
import { ServicesModule } from './services/services.module';
import { ProjectsModule } from './projects/projects.module';
import { PricingModule } from './pricing/pricing.module';
import { ExperienceModule } from './experience/experience.module';
import { AboutModule } from './about/about.module';
import { StackModule } from './stack/stack.module';
import { HobbyModule } from './hobby/hobby.module';
import { SeoModule } from './seo/seo.module';
import { LeadsModule } from './leads/leads.module';
import { MediaModule } from './media/media.module';
import { PublishModule } from './publish/publish.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      cache: true,
      validate: validateEnv,
      envFilePath: ['.env', '../../.env'],
    }),
    ThrottlerModule.forRoot([{ ttl: 60_000, limit: 100 }]),
    PrismaModule,
    AuthModule,
    ContentModule,
    SettingsModule,
    HomeContentModule,
    ServicesModule,
    ProjectsModule,
    PricingModule,
    ExperienceModule,
    AboutModule,
    StackModule,
    HobbyModule,
    SeoModule,
    LeadsModule,
    MediaModule,
    PublishModule,
  ],
  controllers: [AppController],
  providers: [
    { provide: APP_GUARD, useClass: ThrottlerGuard },
    { provide: APP_GUARD, useClass: JwtAuthGuard },
    { provide: APP_GUARD, useClass: RolesGuard },
  ],
})
export class AppModule {}
