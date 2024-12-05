'use client'

import { Card, CardHeader, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Mail, Github, Linkedin } from "lucide-react"

export default function ContactPage() {
  return (
    <div className="container mx-auto py-10">
      <Card className="max-w-2xl mx-auto">
        <CardHeader>
          <h2 className="text-3xl font-bold text-center">Get in Touch</h2>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Social Links */}
          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <Button
              variant="outline"
              onClick={() => window.open('https://linkedin.com/in/justin-daludado')}
              className="flex items-center gap-2"
            >
              <Linkedin className="h-5 w-5" />
              LinkedIn
            </Button>
            
            <Button
              variant="outline"
              onClick={() => window.open('https://github.com/justindal')}
              className="flex items-center gap-2"
            >
              <Github className="h-5 w-5" />
              GitHub
            </Button>

            <Button
              variant="outline"
              onClick={() => window.location.href = 'mailto:justinbdaludado@gmail.com'}
              className="flex items-center gap-2"
            >
              <Mail className="h-5 w-5" />
              Email
            </Button>
          </div>

          {/* Contact Message */}
          <div className="text-center text-muted-foreground">
            <p>Feel free to reach out through any of these channels.</p>
            <p>I'll get back to you as soon as possible!</p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}