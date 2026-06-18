-- Migration: convert Farm.amenities TEXT[] -> jsonb (array of objects)

BEGIN;

-- Add a temporary jsonb column
ALTER TABLE "Farm" ADD COLUMN amenities_json jsonb;

-- Populate it by converting each text array element:
-- - if the element looks like JSON (starts with '{' or '['), cast to jsonb
-- - otherwise wrap it as {"name": <elem>}
UPDATE "Farm" SET amenities_json = (
  SELECT jsonb_agg(
    CASE
      WHEN elem IS NULL THEN NULL
      WHEN btrim(elem) LIKE '{%' OR btrim(elem) LIKE '[%' THEN elem::jsonb
      ELSE jsonb_build_object('name', elem)
    END
  )
  FROM unnest(coalesce(amenities, ARRAY[]::text[])) AS t(elem)
);

-- For rows where original amenities was NULL or empty, ensure an empty array
UPDATE "Farm" SET amenities_json = '[]'::jsonb WHERE amenities_json IS NULL;

-- Drop old column and rename new one
ALTER TABLE "Farm" DROP COLUMN amenities;
ALTER TABLE "Farm" RENAME COLUMN amenities_json TO amenities;

COMMIT;
