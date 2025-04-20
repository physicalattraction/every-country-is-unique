import { ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';

import { ApiKeyGuard } from './api-key.guard';

describe('ApiKeyGuard', () => {
    let guard: ApiKeyGuard;
    let configService: ConfigService;

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                ApiKeyGuard,
                {
                    provide: ConfigService,
                    useValue: {
                        get: jest.fn().mockReturnValue('test-api-key'),
                    },
                },
            ],
        }).compile();

        guard = module.get<ApiKeyGuard>(ApiKeyGuard);
        configService = module.get<ConfigService>(ConfigService);
    });

    it('should be defined', () => {
        expect(guard).toBeDefined();
    });

    it('should allow request with valid API key', () => {
        const context = {
            switchToHttp: () => ({
                getRequest: () => ({
                    header: () => 'test-api-key',
                }),
            }),
        } as ExecutionContext;

        expect(() => guard.canActivate(context)).not.toThrow();
        expect(guard.canActivate(context)).toBe(true);
    });

    it('should reject request with invalid API key', () => {
        const context = {
            switchToHttp: () => ({
                getRequest: () => ({
                    header: () => 'wrong-api-key',
                }),
            }),
        } as ExecutionContext;

        expect(() => guard.canActivate(context)).toThrow(UnauthorizedException);
    });

    it('should reject request with missing API key', () => {
        const context = {
            switchToHttp: () => ({
                getRequest: () => ({
                    header: () => null,
                }),
            }),
        } as ExecutionContext;

        expect(() => guard.canActivate(context)).toThrow(UnauthorizedException);
    });
}); 