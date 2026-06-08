import { MigrationInterface, QueryRunner } from 'typeorm';

export class Migration1780665647778 implements MigrationInterface {
  name = 'Migration1780665647778';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "enrollments" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "session_id" uuid NOT NULL, "attendee_id" uuid NOT NULL, "status" text NOT NULL, "enrolled_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(), CONSTRAINT "UQ_7d62dd0e0f1fd1e880968f3dbf9" UNIQUE ("session_id", "attendee_id"), CONSTRAINT "PK_7c0f752f9fb68bf6ed7367ab00f" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "class_sessions" ("id" uuid NOT NULL, "title" text NOT NULL, "starts_at" TIMESTAMP WITH TIME ZONE NOT NULL, "capacity" integer NOT NULL, "status" text NOT NULL, "version" integer NOT NULL DEFAULT '0', "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "CHK_808305bddb5f1ac70ace278b86" CHECK ("capacity" > 0), CONSTRAINT "PK_dc034da48c6e0cf95c51f606c4e" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `ALTER TABLE "enrollments" ADD CONSTRAINT "FK_26fc1c926ec2d9e07ed686d85dc" FOREIGN KEY ("session_id") REFERENCES "class_sessions"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "enrollments" DROP CONSTRAINT "FK_26fc1c926ec2d9e07ed686d85dc"`,
    );
    await queryRunner.query(`DROP TABLE "class_sessions"`);
    await queryRunner.query(`DROP TABLE "enrollments"`);
  }
}
