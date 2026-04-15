/**
 * File: policies.module.ts
 * Description: Policies module wiring the policy engine and repository adapter.
 * Deprecated: replaced by policy-engine module backed by DB entities.
 */

import { Module } from '@nestjs/common';
import { InMemoryPolicyRepository } from './repositories/in-memory-policy.repository';
import { PolicyEngineService } from './services/policy-engine.service';

@Module({
	providers: [
		PolicyEngineService,
		{
			provide: 'IPolicyRepository',
			useClass: InMemoryPolicyRepository,
		},
	],
	exports: [PolicyEngineService],
})
export class PoliciesModule {}

