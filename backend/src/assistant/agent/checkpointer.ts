import { Injectable, Logger, type OnModuleInit } from '@nestjs/common';
import { InjectConnection } from '@nestjs/mongoose';
import type { Connection } from 'mongoose';
import { MongoDBSaver } from '@langchain/langgraph-checkpoint-mongodb';

const CHECKPOINT_COLLECTION = 'agent_checkpoints';
const CHECKPOINT_WRITES_COLLECTION = 'agent_checkpoint_writes';

type SaverClient = ConstructorParameters<typeof MongoDBSaver>[0]['client'];

@Injectable()
export class AgentCheckpointerService implements OnModuleInit {
  private readonly logger = new Logger(AgentCheckpointerService.name);
  private saver?: MongoDBSaver;

  constructor(@InjectConnection() private readonly connection: Connection) {}

  async onModuleInit(): Promise<void> {
    const errors = await this.getSaver().setup();
    if (errors.length > 0) {
      const message = errors.map((error) => error.message).join('; ');
      throw new Error(`Failed to set up agent checkpointer: ${message}`);
    }
    this.logger.log('Agent MongoDB checkpoint saver ready');
  }

  getSaver(): MongoDBSaver {
    if (!this.saver) {
      const client = this.connection.getClient() as unknown as SaverClient;
      this.saver = new MongoDBSaver({
        client,
        dbName: this.connection.db?.databaseName,
        checkpointCollectionName: CHECKPOINT_COLLECTION,
        checkpointWritesCollectionName: CHECKPOINT_WRITES_COLLECTION,
      });
    }
    return this.saver;
  }
}
