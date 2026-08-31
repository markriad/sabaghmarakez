"""A static server that mimics Cloudflare's html_handling = auto-trailing-slash:
   /thank-you serves thank-you.html. python -m http.server does not, which made
   every conversion test since the extensionless redirect land on a 404."""
import http.server, functools, os, sys
class CF(http.server.SimpleHTTPRequestHandler):
    def translate_path(self, path):
        p=super().translate_path(path.split('?')[0])
        if not os.path.exists(p) and not p.endswith('.html'):
            if os.path.exists(p+'.html'): return p+'.html'
        return p
def serve(directory, port):
    h=functools.partial(CF, directory=directory)
    return http.server.ThreadingHTTPServer(("127.0.0.1",port), h)
if __name__=="__main__":
    d,port=sys.argv[1],int(sys.argv[2])
    serve(d,port).serve_forever()
