import json
import random

import google.appengine.api.users
import webapp2

import analyze
import db.game
import encoder_decoder
import generate_clues
import name_to_id


class PublishHandler(webapp2.RequestHandler):
  def post(self):
    try:
      data = json.loads(self.request.body)
      self.response.headers['Content-Type'] = 'application/json'
      user = google.appengine.api.users.get_current_user()
      if user:
        game_id = data['game_id']
        game = db.game.Game.get_by_id(game_id)

        name = data['name']
        if not game or game.creator != user.email():
          append_number = 0
          name_stub = name_to_id.name_to_id(name)
          if not name_stub:
            name_stub = 'puzzle_{}'.format(random.randint(1000, 10000))
          while True:
            game_id = ('{}_{}'.format(name_stub, append_number)
                       if append_number else name_stub)
            if not db.game.Game.get_by_id(game_id):
              break
            append_number += 1

        spec = data['spec']
        encoded_data = data['grid_data']
        style = data['style']
        grid_data = encoder_decoder.decode(spec, encoded_data)
        clues = generate_clues.generate_clues(spec, grid_data)
        rounds = analyze.analyze(spec, clues)
        game = db.game.Game(id=game_id,
                            name=name,
                            width=spec['width'],
                            height=spec['height'],
                            style=style,
                            grid_data=encoded_data,
                            difficulty=rounds,
                            creator=user.email())
        game.put()
        out = {
          'game': game.data()
        }
      else:
        out = {'login': google.appengine.api.users.create_login_url(
          self.request.referrer)}

    except Exception as e:
      out = {'exception': e.message}

    self.response.out.write(json.dumps(out))
