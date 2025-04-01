-- Create spark_categories junction table
CREATE TABLE IF NOT EXISTS spark_categories (
  spark_id UUID NOT NULL REFERENCES sparks(id) ON DELETE CASCADE,
  category_id UUID NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
  job_action_id UUID NULL, -- Reference to the job action that created this
  created_by TEXT NULL, -- To track if this was added by AI, user, etc.
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (spark_id, category_id)
);

-- Create spark_tags junction table
CREATE TABLE IF NOT EXISTS spark_tags (
  spark_id UUID NOT NULL REFERENCES sparks(id) ON DELETE CASCADE,
  tag_id UUID NOT NULL REFERENCES tags(id) ON DELETE CASCADE,
  job_action_id UUID NULL, -- Reference to the job action that created this
  created_by TEXT NULL, -- To track if this was added by AI, user, etc.
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (spark_id, tag_id)
);

-- Add RLS to junction tables
ALTER TABLE spark_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE spark_tags ENABLE ROW LEVEL SECURITY;

-- Create policies for spark_categories
CREATE POLICY "Users can only view their own spark categories" 
  ON spark_categories FOR SELECT 
  USING (EXISTS (
    SELECT 1 FROM sparks 
    WHERE sparks.id = spark_categories.spark_id 
    AND sparks.user_id = auth.uid()
  ));

CREATE POLICY "Users can only insert their own spark categories" 
  ON spark_categories FOR INSERT 
  WITH CHECK (EXISTS (
    SELECT 1 FROM sparks 
    WHERE sparks.id = spark_categories.spark_id 
    AND sparks.user_id = auth.uid()
  ));

CREATE POLICY "Users can only delete their own spark categories" 
  ON spark_categories FOR DELETE 
  USING (EXISTS (
    SELECT 1 FROM sparks 
    WHERE sparks.id = spark_categories.spark_id 
    AND sparks.user_id = auth.uid()
  ));

-- Create policies for spark_tags
CREATE POLICY "Users can only view their own spark tags" 
  ON spark_tags FOR SELECT 
  USING (EXISTS (
    SELECT 1 FROM sparks 
    WHERE sparks.id = spark_tags.spark_id 
    AND sparks.user_id = auth.uid()
  ));

CREATE POLICY "Users can only insert their own spark tags" 
  ON spark_tags FOR INSERT 
  WITH CHECK (EXISTS (
    SELECT 1 FROM sparks 
    WHERE sparks.id = spark_tags.spark_id 
    AND sparks.user_id = auth.uid()
  ));

CREATE POLICY "Users can only delete their own spark tags" 
  ON spark_tags FOR DELETE 
  USING (EXISTS (
    SELECT 1 FROM sparks 
    WHERE sparks.id = spark_tags.spark_id 
    AND sparks.user_id = auth.uid()
  ));

-- Create indexes for faster lookups
CREATE INDEX spark_categories_spark_id_idx ON spark_categories(spark_id);
CREATE INDEX spark_categories_category_id_idx ON spark_categories(category_id);
CREATE INDEX spark_categories_job_action_id_idx ON spark_categories(job_action_id);
CREATE INDEX spark_tags_spark_id_idx ON spark_tags(spark_id);
CREATE INDEX spark_tags_tag_id_idx ON spark_tags(tag_id);
CREATE INDEX spark_tags_job_action_id_idx ON spark_tags(job_action_id);
