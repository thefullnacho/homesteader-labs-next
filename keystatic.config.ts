import { config, collection, fields } from '@keystatic/core';

export default config({
  storage: { kind: 'local' },
  collections: {
    archive: collection({
      label: 'Archive',
      slugField: 'title',
      path: 'content/archive/*',
      format: { contentField: 'content' },
      schema: {
        title: fields.slug({
          name: { label: 'Title', validation: { isRequired: true } },
        }),
        description: fields.text({
          label: 'Description',
          validation: { isRequired: true },
        }),
        date: fields.date({
          label: 'Date',
          validation: { isRequired: true },
        }),
        author: fields.text({
          label: 'Author',
          validation: { isRequired: true },
        }),
        tags: fields.array(
          fields.text({ label: 'Tag' }),
          { label: 'Tags', itemLabel: (props) => props.value ?? 'Tag' }
        ),
        category: fields.text({ label: 'Category' }),
        excerpt: fields.text({ label: 'Excerpt', multiline: true }),
        content: fields.mdx({ label: 'Content' }),
      },
    }),
  },
});
