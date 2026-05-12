/**
 * Mongoose Plugin for Soft Deletes
 * Automatically filters out documents where isDeleted is true.
 */
module.exports = function softDeletePlugin(schema) {
  // Add the isDeleted field to the schema if not already present via base schema
  if (!schema.path('isDeleted')) {
    schema.add({ isDeleted: { type: Boolean, default: false } });
  }

  // Middleware to filter find queries
  schema.pre(/^find/, function () {
    this.where({ isDeleted: { $ne: true } });
  });

  // Middleware to handle aggregation pipelines
  schema.pre('aggregate', function () {
    // Note: If using Atlas Search ($search), $search must remain the first stage.
    const pipeline = this.pipeline() || [];
    const isAtlasSearch = pipeline.length > 0 && 
                          pipeline[0] && 
                          Object.keys(pipeline[0])[0] === '$search';

    if (isAtlasSearch) {
      pipeline.splice(1, 0, { $match: { isDeleted: { $ne: true } } });
    } else {
      pipeline.unshift({ $match: { isDeleted: { $ne: true } } });
    }
  });
};