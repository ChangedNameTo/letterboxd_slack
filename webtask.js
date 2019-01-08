const request = require('request-promise@1.0.2');

/**
 * NotFoundError
 */
class NotFoundError extends Error {}

const buildError = (text = 'test', color = 'danger', hasMarkDown = true) => ({
  text,
  color,
  mrkdwn_in: ['text'],
});

const buildSuccess = (text, poster, title, rating, link) => ({
  text,
  response_type: 'in_channel',
  attachments: [
    {
      thumb_url: poster,
      fields: [
        {
          title: 'Title',
          value: title,
          short: true,
        },
        {
          title: 'Rating',
          value: rating,
          short: true,
        },
        {
          title: 'Link',
          value: `<${link}|View on Letterboxd...>`,
          short: false,
        },
      ],
      mrkdwn_in: ['text'],
    }
  ],
});

const getRecentMovie = (username) => {
  const url = `https://letterboxd.com/${username}/rss/`;

  return request.get({ url, method: 'GET', dataType: "xml"})
    .then((response) => {
      if(!response) {
        throw new NotFoundError("No response...");
      }

      console.log(response);
    });
};

module.exports = (ctx, cb) => {
  const username = ctx.body.text.split(" ")[0];

  if (!username.length) {
    return cb(null, buildError("Please provide a username"));
  }

  cb(null, {
    response_type: 'in_channel',
    text: getRecentMovie(username),
  });
};
