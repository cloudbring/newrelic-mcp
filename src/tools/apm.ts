import { Tool } from '@modelcontextprotocol/sdk/types.js';
import { NewRelicClient, ApmApplication } from '../client/newrelic-client';
import { withToolSpan, addSpanAttributes } from '../instrumentation/otel-setup';
import { createChildLogger } from '../logger/winston-logger';
import { logger } from '../logger/winston-logger';

export class ApmTool {
  private client: NewRelicClient;
  private logger: typeof logger;

  constructor(client: NewRelicClient) {
    this.client = client;
    this.logger = createChildLogger(logger, 'ApmTool');
  }

  getListApplicationsTool(): Tool {
    return {
      name: 'list_apm_applications',
      description: 'List all APM applications in your New Relic account',
      inputSchema: {
        type: 'object',
        properties: {
          target_account_id: {
            type: 'string',
            description: 'Optional New Relic account ID'
          }
        }
      }
    };
  }

  async execute(input: any): Promise<ApmApplication[]> {
    return withToolSpan(
      'apm',
      'list_applications',
      async () => {
        this.logger.info('Listing APM applications', {
          accountId: input.target_account_id,
        });

        if (!input.target_account_id) {
          const error = new Error('Account ID must be provided');
          this.logger.error('Account ID missing', { error: error.message });
          throw error;
        }

        // Add span attributes
        addSpanAttributes({
          'apm.account_id': input.target_account_id,
          'apm.operation': 'list_applications',
        });

        const startTime = Date.now();
        const applications = await this.client.listApmApplications(input.target_account_id);
        const duration = Date.now() - startTime;

        this.logger.info('APM applications retrieved', {
          duration,
          applicationCount: applications.length,
          accountId: input.target_account_id,
        });

        // Add result attributes to span
        addSpanAttributes({
          'apm.application_count': applications.length,
          'apm.duration_ms': duration,
        });

        return applications;
      },
      {
        'tool.name': 'apm',
        'tool.operation': 'list_applications',
      }
    );
  }
}