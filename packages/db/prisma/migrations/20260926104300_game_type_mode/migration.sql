-- CreateEnum
CREATE TYPE "GameMode" AS ENUM ('DEFAULT', 'DUEL', 'FASTEST_FINGER_FIRST');

-- CreateEnum
CREATE TYPE "GameType_new" AS ENUM ('MATHS', 'PUZZLE', 'MEMORY', 'LOGIC');

-- AlterTable
ALTER TABLE "Game" ADD COLUMN "mode" "GameMode" NOT NULL DEFAULT 'DEFAULT';

UPDATE "Game" SET "mode" = 'DUEL' WHERE "type"::text = 'DUELS';
UPDATE "Game" SET "mode" = 'FASTEST_FINGER_FIRST' WHERE "type"::text = 'FASTEST_FINGER_FIRST';

ALTER TABLE "Game" ALTER COLUMN "type" TYPE "GameType_new" USING 'MATHS'::"GameType_new";

DROP TYPE "GameType";
ALTER TYPE "GameType_new" RENAME TO "GameType";
