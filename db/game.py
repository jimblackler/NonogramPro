from google.appengine.ext import ndb


class Game(ndb.Model):
  grid_data = ndb.StringProperty()
  name = ndb.StringProperty()
  width = ndb.IntegerProperty()
  height = ndb.IntegerProperty()
  difficulty = ndb.IntegerProperty()
  creator = ndb.StringProperty()
  style = ndb.StringProperty()

  def data(self):
    return {'key': self.key.id(),
            'data': {
              'creator': self.creator,
              'difficulty': self.difficulty,
              'grid_data': self.grid_data,
              'spec': {
                'width': self.width, 'height': self.height},
              'name': self.name,
              'style': self.style}}
