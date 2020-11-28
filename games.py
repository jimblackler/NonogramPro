import google.appengine.api.users
import json
import webapp2

import db.game


class GetGamesHandler(webapp2.RequestHandler):

  def get(self):

    try:
      game_id = self.request.get('id')
      if game_id:
        game = db.game.Game.get_by_id(game_id)
        if game:
          games = [game]
        else:
          games = []
      else:
        games = db.game.Game.query()

      out = {
        'results': [game.data() for game in games]
      }
    except Exception as e:
      out = {'exception': e.message}

    self.response.headers['Content-Type'] = 'application/json'
    self.response.out.write(json.dumps(out, indent=2))
