import json

import google.appengine.api.users
import webapp2

import db.game


class DeleteHandler(webapp2.RequestHandler):
  def post(self):
    try:
      data = json.loads(self.request.body)
      self.response.headers['Content-Type'] = 'application/json'
      user = google.appengine.api.users.get_current_user()
      if not user:
        raise Exception('Not signed in')

      game_id = data['game_id']

      game = db.game.Game.get_by_id(game_id)

      if game and game.creator == user.email():
        game.key.delete()
      out = {
        'game_id': game_id
      }
    except Exception as e:
      out = {'exception': e.message}

    self.response.out.write(json.dumps(out))
