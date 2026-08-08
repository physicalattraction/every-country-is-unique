import { Controller, Get } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';

@ApiTags('health')
@Controller('health')
export class HealthController {
    @Get()
    @ApiOperation({
        summary: 'Health check',
        description: 'Returns the health status of the API',
    })
    @ApiResponse({
        status: 200,
        description: 'API is healthy',
    })
    check() {
        return {
            status: 'ok',
            timestamp: new Date().toISOString(),
        };
    }
}
