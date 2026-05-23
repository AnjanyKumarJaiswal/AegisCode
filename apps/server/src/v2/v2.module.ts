import { Module } from '@nestjs/common';
import { DashboardModule } from './dashboard/dashboard.module';
import { LogsModule } from './logs/logs.module';
import { SettingsModule } from './settings/settings.module';
import { ThreatsModule } from './threats/threats.module';
import { VulnerabilitiesModule } from './vulnerabilities/vulnerabilities.module';

@Module({
  imports: [
    DashboardModule,
    LogsModule,
    SettingsModule,
    ThreatsModule,
    VulnerabilitiesModule,
  ],
})
export class V2Module {}
