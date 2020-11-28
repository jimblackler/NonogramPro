import os

import google.appengine.api.users
import jinja2
import webapp2

import delete
import games
import publish

template_path = os.path.join(os.path.dirname(__file__), 'templates')
JINJA_ENVIRONMENT = jinja2.Environment(
  loader=jinja2.FileSystemLoader(template_path),
  extensions=['jinja2.ext.autoescape'],
  autoescape=True)



class BaseHandler(webapp2.RequestHandler):
  def render(self, name):
    template_values = {}
    user = google.appengine.api.users.get_current_user()
    if user:
      template_values['user'] = user
      template_values['logout'] = google.appengine.api.users.create_logout_url(
        self.request.url)
    else:
      template_values['login'] = google.appengine.api.users.create_login_url(
        self.request.url)
    template = JINJA_ENVIRONMENT.get_template(name)
    self.response.write(template.render(template_values))


class EditHandler(BaseHandler):
  def get(self):
    self.render('edit.html')


class PlayHandler(BaseHandler):
  def get(self):
    self.render('play.html')


class ListHandler(BaseHandler):
  def get(self):
    self.render('list.html')


app = webapp2.WSGIApplication([
  ('/delete', delete.DeleteHandler),
  ('/edit', EditHandler),
  ('/games', games.GetGamesHandler),
  ('/play', PlayHandler),
  ('/publish', publish.PublishHandler),

  ('/', ListHandler),
], debug=True)
