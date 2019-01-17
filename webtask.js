const request = require('request-promise@1.0.2');
const parse   = require('xml2js').parseString;
const jsdom   = require('jsdom');

const { JSDOM } = jsdom;

/**
 * NotFoundError
 */
class NotFoundError extends Error { }

const buildError = (text = 'test', color = 'danger', hasMarkDown = true) => ({
  text,
  color,
  mrkdwn_in: ['text'],
});

const buildSuccess = (username, poster, title_and_rating, watched_on, link, review/*, add_to_watchlist*/) => ({
  text: `*${username}* recently watched:`,
  response_type: 'in_channel',
  attachments: [
    {
      thumb_url: poster,
      fields: [
        {
          title: 'Title/Rating',
          value: title_and_rating,
          short: true,
        },

        {
          title: 'Reviewed On',
          value: watched_on,
          short: true,
        },

        {
          title: 'Review',
          value: review,
          short: true,
        },

        {
          title: 'Link to Review',
          value: `<${link}|View on Letterboxd...>`,
          short: false,
        },

        // {
        //   title: 'Add to watchlist',
        //   value: `<${add_to_watchlist}|Add...>`,
        //   short: false,
        // },
      ],

      mrkdwn_in: ['text'],
    }
  ],
});

const getRecentMovie = (username) => {
  const url = `https://letterboxd.com/${username}/rss/`;

  return request.get({ url, method: 'GET' })
    .then((response) => {
      if (!response) {
        throw new NotFoundError("No response...");
      }

      return new Promise((resolve) => {
        parse(response, {}, (err, result) => {
          const previous_movie = result.rss.channel[0].item[0];
          const poster_dom     = new JSDOM(previous_movie.description[0]);

          const url_regex = /\/([\w-]+)\/$/;
          const add_to_watchlist = "https://letterboxd.com/film" + previous_movie.link[0].match(url_regex)[0] + "add-to-watchlist/";

          resolve({
            title_and_rating : previous_movie.title[0],
            watched_on       : previous_movie['letterboxd:watchedDate'][0],
            link             : previous_movie.link[0],
            poster           : poster_dom.window.document.querySelector('img').src,
            review           : poster_dom.window.document.querySelectorAll('p')['1'].textContent,
            // add_to_watchlist : add_to_watchlist,
          });
        });
      });
    });
};

module.exports = (ctx, cb) => {
  const username = ctx.body.text.split(" ")[0];

  if (!username.length) {
    return cb(null, buildError("Please provide a username"));
  }

  return getRecentMovie(username)
    .then(({ title_and_rating, watched_on, link, poster, review/*, add_to_watchlist*/ }) => {
      const response = buildSuccess(username, poster, title_and_rating, watched_on, link, review/*, add_to_watchlist*/);
      cb(null, response);
    });
};
