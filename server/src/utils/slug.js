/**
 * Slug generator with collision handling
 */

/**
 * Converts a string into a URL-friendly slug
 * @param {string} text
 * @returns {string}
 */
const generateSlug = (text) => {
  if (!text) return '';
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/[\s\W-]+/g, '-') // Replace spaces and non-word characters with hyphen
    .replace(/^-+|-+$/g, ''); // Remove leading and trailing hyphens
};

/**
 * Generates a unique slug by checking against existing database records
 * @param {string} baseName
 * @param {import('mongoose').Model} model - Mongoose Model to check collisions against
 * @param {string} currentId - Optional ID to ignore for updates
 * @returns {Promise<string>} Unique slug
 */
const generateUniqueSlug = async (baseName, model, currentId = null) => {
  let baseSlug = generateSlug(baseName);
  if (!baseSlug) {
    baseSlug = 'organization';
  }

  let slug = baseSlug;
  let counter = 1;

  while (true) {
    const query = { slug };
    if (currentId) {
      query._id = { $ne: currentId };
    }

    const exists = await model.findOne(query);
    if (!exists) {
      return slug;
    }

    slug = `${baseSlug}-${counter}`;
    counter += 1;
  }
};

module.exports = {
  generateSlug,
  generateUniqueSlug,
};
