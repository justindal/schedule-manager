'use client'

import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card'
import Link from 'next/link'
import {
  CalendarDays,
  Users,
  Clock,
  Shield,
  Menu,
  Briefcase,
  MessageSquare,
  Star,
  HelpCircle,
  ArrowRight,
  ThumbsUp,
  Plus,
  X,
  LogIn,
  UserPlus,
  Send,
} from 'lucide-react'
import Image from 'next/image'
import { useState } from 'react'
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselPrevious,
  CarouselNext,
} from '@/components/ui/carousel'

const faqs = [
  {
    question: 'Is ShiftTrack suitable for small businesses?',
    answer:
      'Absolutely! ShiftTrack is designed to scale and can be used by businesses of all sizes, from small teams to larger enterprises.',
  },
  {
    question: 'How do I get started with ShiftTrack?',
    answer:
      'Getting started is easy! Simply sign up for a free account, create your first store, and you can begin inviting your team members and building schedules right away.',
  },
  {
    question: 'Can I access ShiftTrack on multiple devices?',
    answer:
      'Yes, ShiftTrack is a web-based application, so you can access it from any device with an internet browser, including desktops, laptops, tablets, and smartphones.',
  },
  {
    question: 'Is my data secure with ShiftTrack?',
    answer:
      'We take data security very seriously. All data is encrypted, and we follow industry best practices to ensure your information is safe and secure.',
  },
]

const carouselImages = [
  {
    src: '/images/capture1.jpeg',
    alt: 'App Preview 1',
  },
  {
    src: '/images/capture2.jpeg',
    alt: 'App Preview 2',
  },
  {
    src: '/images/capture3.jpeg',
    alt: 'App Preview 3',
  },
  {
    src: '/images/capture4.jpeg',
    alt: 'App Preview 4',
  },
  {
    src: '/images/capture5.jpeg',
    alt: 'App Preview 5',
  },
]

export default function Home() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  return (
    <div className='min-h-screen bg-background flex flex-col'>
      <nav className='border-b px-4 py-3 sticky top-0 z-50 bg-background/95 backdrop-blur-sm'>
        <div className='max-w-7xl mx-auto flex justify-between items-center'>
          <Link href='/' className='flex items-center gap-2'>
            <Image
              src='/images/logo.png'
              alt='ShiftTrack Logo'
              width={64}
              height={64}
              className='h-8 w-8 rounded-lg dark:hidden'
            />
            <Image
              src='/images/logo-dark.png'
              alt='ShiftTrack Logo'
              width={64}
              height={64}
              className='h-8 w-8 rounded-lg hidden dark:block'
            />
            <span className='font-bold text-2xl'>ShiftTrack</span>
          </Link>
          <div className='hidden md:flex items-center gap-6 text-sm font-medium'>
            <Link
              href='#features'
              className='hover:text-primary transition-colors'
            >
              Features
            </Link>
            <Link
              href='#why-choose-us'
              className='hover:text-primary transition-colors'
            >
              Why Choose Us
            </Link>
            <Link
              href='#how-it-works'
              className='hover:text-primary transition-colors'
            >
              How It Works
            </Link>
            <Link href='#faq' className='hover:text-primary transition-colors'>
              FAQs
            </Link>
            <Link
              href='/contact'
              className='hover:text-primary transition-colors'
            >
              Contact
            </Link>
          </div>
          <div className='hidden md:flex items-center gap-2'>
            <Button variant='outline' asChild>
              <Link href='/login'>Login</Link>
            </Button>
            <Button asChild>
              <Link href='/register'>Get Started</Link>
            </Button>
          </div>
          <div className='md:hidden'>
            <Button
              variant='ghost'
              size='icon'
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            >
              {isMobileMenuOpen ? (
                <X className='h-6 w-6' />
              ) : (
                <Menu className='h-6 w-6' />
              )}
            </Button>
          </div>
        </div>
        {isMobileMenuOpen && (
          <div className='md:hidden absolute top-full left-0 right-0 bg-background border-b shadow-lg py-4'>
            <div className='max-w-7xl mx-auto px-4 flex flex-col space-y-4'>
              <Link
                href='#features'
                className='hover:text-primary transition-colors block py-2'
                onClick={() => setIsMobileMenuOpen(false)}
              >
                Features
              </Link>
              <Link
                href='#why-choose-us'
                className='hover:text-primary transition-colors block py-2'
                onClick={() => setIsMobileMenuOpen(false)}
              >
                Why Choose Us
              </Link>
              <Link
                href='#how-it-works'
                className='hover:text-primary transition-colors block py-2'
                onClick={() => setIsMobileMenuOpen(false)}
              >
                How It Works
              </Link>
              <Link
                href='#faq'
                className='hover:text-primary transition-colors block py-2'
                onClick={() => setIsMobileMenuOpen(false)}
              >
                FAQs
              </Link>
              <div className='border-t pt-4 flex flex-col space-y-2'>
                <Button
                  variant='outline'
                  asChild
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  <Link href='/login'>Login</Link>
                </Button>
                <Button asChild onClick={() => setIsMobileMenuOpen(false)}>
                  <Link href='/register'>Get Started</Link>
                </Button>
              </div>
            </div>
          </div>
        )}
      </nav>

      <div className='absolute inset-0 -z-10 overflow-hidden'>
        <div className='absolute -top-40 -right-32 h-[500px] w-[500px] rounded-full bg-primary/5' />
        <div className='absolute -bottom-40 -left-32 h-[500px] w-[500px] rounded-full bg-primary/5' />
      </div>

      <main className='flex-grow pb-16 sm:pb-24'>
        <section className='max-w-7xl mx-auto px-4 py-20 sm:py-28 lg:py-36 text-center'>
          <h1 className='text-4xl sm:text-5xl lg:text-7xl font-bold mb-6 leading-tight'>
            ShiftTrack
          </h1>
          <p className='text-lg sm:text-xl text-muted-foreground mb-10 max-w-2xl mx-auto'>
            The simplest way to manage employee shifts and availability. Create
            schedules, collaborate with your team, and streamline your
            operations.
          </p>
          <div className='flex justify-center items-center gap-4 mb-6'>
            <Button asChild size='lg' className='px-8 py-3 text-lg'>
              <Link href='/register'>
                Get Started <ArrowRight className='w-5 h-5 ml-2' />
              </Link>
            </Button>
          </div>
          <p className='text-xs text-muted-foreground mb-10'>
            By continuing, you agree to our Terms of Service and Privacy Policy
          </p>
        </section>

        <section id='features' className='pt-10 sm:pt-14 pb-20 sm:pb-28'>
          <div className='max-w-7xl mx-auto px-4'>
            <h2 className='text-3xl sm:text-4xl font-bold text-center mb-6'>
              Everything you need for smooth scheduling
            </h2>
            <p className='text-lg text-muted-foreground text-center mb-16 max-w-2xl mx-auto'>
              ShiftTrack provides a comprehensive suite of tools to simplify
              your workforce management.
            </p>
            <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8'>
              <Card className='flex flex-col'>
                <CardHeader>
                  <div className='p-3 bg-primary/10 rounded-md w-fit mb-4'>
                    <Briefcase className='h-8 w-8 text-primary' />
                  </div>
                  <CardTitle className='text-2xl'>
                    Store & Team Organization
                  </CardTitle>
                </CardHeader>
                <CardContent className='flex-grow'>
                  <p className='text-muted-foreground'>
                    Easily create and manage separate stores. Organize your
                    staff, assign roles, and streamline operations across
                    multiple teams or locations.
                  </p>
                </CardContent>
              </Card>

              <Card className='flex flex-col'>
                <CardHeader>
                  <div className='p-3 bg-primary/10 rounded-md w-fit mb-4'>
                    <CalendarDays className='h-8 w-8 text-primary' />
                  </div>
                  <CardTitle className='text-2xl'>
                    Intuitive Scheduling
                  </CardTitle>
                </CardHeader>
                <CardContent className='flex-grow'>
                  <p className='text-muted-foreground'>
                    Effortlessly create optimal schedules. Consider employee
                    availability and preferences, and publish shifts in minutes,
                    not hours.
                  </p>
                </CardContent>
              </Card>

              <Card className='flex flex-col'>
                <CardHeader>
                  <div className='p-3 bg-primary/10 rounded-md w-fit mb-4'>
                    <Users className='h-8 w-8 text-primary' />
                  </div>
                  <CardTitle className='text-2xl'>
                    Seamless Team Collaboration
                  </CardTitle>
                </CardHeader>
                <CardContent className='flex-grow'>
                  <p className='text-muted-foreground'>
                    Keep your team informed with real-time schedule updates and
                    easy to read schedules.
                  </p>
                </CardContent>
              </Card>

              <Card className='flex flex-col'>
                <CardHeader>
                  <div className='p-3 bg-primary/10 rounded-md w-fit mb-4'>
                    <Clock className='h-8 w-8 text-primary' />
                  </div>
                  <CardTitle className='text-2xl'>
                    Efficient Time Management
                  </CardTitle>
                </CardHeader>
                <CardContent className='flex-grow'>
                  <p className='text-muted-foreground'>
                    Accurately track work hours, manage employee availability,
                    and handle time-off requests with ease.
                  </p>
                </CardContent>
              </Card>

              <Card className='flex flex-col'>
                <CardHeader>
                  <div className='p-3 bg-primary/10 rounded-md w-fit mb-4'>
                    <Shield className='h-8 w-8 text-primary' />
                  </div>
                  <CardTitle className='text-2xl'>
                    Secure & Role-Based Access
                  </CardTitle>
                </CardHeader>
                <CardContent className='flex-grow'>
                  <p className='text-muted-foreground'>
                    Role-based permissions ensure data privacy and secure access
                    for managers, schedulers, and staff members.
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        <section id='why-choose-us' className='py-20 sm:py-28 bg-muted/30'>
          <div className='max-w-7xl mx-auto px-4'>
            <h2 className='text-3xl sm:text-4xl font-bold text-center mb-6'>
              Why Choose ShiftTrack?
            </h2>
            <p className='text-lg text-muted-foreground text-center mb-16 max-w-2xl mx-auto'>
              Discover the advantages that make ShiftTrack the ideal solution
              for your business.
            </p>
            <div className='grid grid-cols-1 md:grid-cols-3 gap-8'>
              <div className='text-center p-6 rounded-lg bg-card border'>
                <div className='p-3 bg-primary/10 rounded-full w-fit mx-auto mb-4'>
                  <ThumbsUp className='h-10 w-10 text-primary' />
                </div>
                <h3 className='text-xl font-semibold mb-2'>
                  Unmatched Simplicity
                </h3>
                <p className='text-muted-foreground'>
                  Our intuitive interface means less training and faster
                  adoption for your entire team.
                </p>
              </div>
              <div className='text-center p-6 rounded-lg bg-card border'>
                <div className='p-3 bg-primary/10 rounded-full w-fit mx-auto mb-4'>
                  <Briefcase className='h-10 w-10 text-primary' />
                </div>
                <h3 className='text-xl font-semibold mb-2'>
                  Flexible Store Management
                </h3>
                <p className='text-muted-foreground'>
                  Perfect for businesses with multiple teams, locations, or
                  departments. Organize with ease.
                </p>
              </div>
              <div className='text-center p-6 rounded-lg bg-card border'>
                <div className='p-3 bg-primary/10 rounded-full w-fit mx-auto mb-4'>
                  <Star className='h-10 w-10 text-primary' />
                </div>
                <h3 className='text-xl font-semibold mb-2'>Focus on Growth</h3>
                <p className='text-muted-foreground'>
                  Simplify scheduling complexities so you can focus on what
                  matters most – growing your business.
                </p>
              </div>
            </div>
          </div>
        </section>

        <section id='how-it-works' className='py-20 sm:py-28'>
          <div className='max-w-7xl mx-auto px-4'>
            <h2 className='text-3xl sm:text-4xl font-bold text-center mb-6'>
              Get Started in 3 Easy Steps
            </h2>
            <p className='text-lg text-muted-foreground text-center mb-16 max-w-2xl mx-auto'>
              ShiftTrack makes schedule management straightforward and
              hassle-free.
            </p>
            <div className='grid grid-cols-1 md:grid-cols-3 gap-8 lg:gap-12'>
              <div className='flex flex-col items-center text-center'>
                <div className='p-4 bg-primary/10 rounded-full w-fit mb-6 ring-8 ring-primary/5'>
                  <LogIn className='h-10 w-10 sm:h-12 sm:w-12 text-primary' />
                </div>
                <h3 className='text-xl sm:text-2xl font-semibold mb-2'>
                  1. Sign Up & Create
                </h3>
                <p className='text-muted-foreground max-w-xs'>
                  Quickly register for an account and set up your first store or
                  team in minutes.
                </p>
              </div>
              <div className='flex flex-col items-center text-center'>
                <div className='p-4 bg-primary/10 rounded-full w-fit mb-6 ring-8 ring-primary/5'>
                  <UserPlus className='h-10 w-10 sm:h-12 sm:w-12 text-primary' />
                </div>
                <h3 className='text-xl sm:text-2xl font-semibold mb-2'>
                  2. Invite & Organize
                </h3>
                <p className='text-muted-foreground max-w-xs'>
                  Add your employees, assign roles, and manage them as needed.
                </p>
              </div>
              <div className='flex flex-col items-center text-center'>
                <div className='p-4 bg-primary/10 rounded-full w-fit mb-6 ring-8 ring-primary/5'>
                  <Send className='h-10 w-10 sm:h-12 sm:w-12 text-primary' />
                </div>
                <h3 className='text-xl sm:text-2xl font-semibold mb-2'>
                  3. Schedule & Share
                </h3>
                <p className='text-muted-foreground max-w-xs'>
                  Build schedules with our intuitive tools, notify your team
                  instantly, and manage availability.
                </p>
              </div>
            </div>
          </div>
        </section>

        <section id='faq' className='py-20 sm:py-28 bg-muted/30'>
          <div className='max-w-4xl mx-auto px-4'>
            <h2 className='text-3xl sm:text-4xl font-bold text-center mb-16'>
              Frequently Asked Questions
            </h2>
            <div className='space-y-6'>
              {faqs.map((faq, index) => (
                <Card key={index} className='bg-card'>
                  <CardHeader>
                    <details>
                      <summary className='text-lg font-semibold cursor-pointer flex justify-between items-center'>
                        {faq.question}
                        <Plus className='h-5 w-5 group-open:rotate-45 transition-transform' />
                      </summary>
                      <p className='text-muted-foreground mt-3 pt-3 border-t'>
                        {faq.answer}
                      </p>
                    </details>
                  </CardHeader>
                </Card>
              ))}
            </div>
          </div>
        </section>

        <section className='py-20 sm:py-28 text-center bg-gradient-to-r from-primary/80 to-primary dark:bg-none dark:bg-gray-800'>
          <div className='max-w-3xl mx-auto px-4'>
            <h2 className='text-3xl sm:text-4xl font-bold text-white mb-6'>
              Ready to Simplify Your Scheduling?
            </h2>
            <p className='text-lg text-white mb-10'>
              Join other businesses in streamlining their operations with
              ShiftTrack. Sign up today and experience the difference.
            </p>
            <Button
              asChild
              size='lg'
              className='bg-background text-primary hover:bg-background/90 dark:bg-primary-foreground dark:text-primary dark:hover:bg-primary-foreground/90 px-10 py-4 text-lg'
            >
              <Link href='/register'>
                Sign Up For Free <ArrowRight className='w-5 h-5 ml-2' />
              </Link>
            </Button>
          </div>
        </section>

        <div className='mt-16 max-w-4xl mx-auto'>
          <Carousel className='w-full' opts={{ loop: true }}>
            <CarouselContent>
              {carouselImages.map((image, index) => (
                <CarouselItem key={index}>
                  <div className='bg-muted/50 border rounded-lg overflow-hidden relative'>
                    <Image
                      src={image.src}
                      alt={image.alt}
                      width={1280}
                      height={720}
                      className='object-contain w-full h-auto'
                    />
                  </div>
                </CarouselItem>
              ))}
            </CarouselContent>
            <CarouselPrevious className='ml-16' />
            <CarouselNext className='mr-16' />
          </Carousel>
        </div>
      </main>

      <footer className='border-t'>
        <div className='max-w-7xl mx-auto px-4 py-8'>
          <div className='grid grid-cols-1 md:grid-cols-3 gap-8 mb-8'>
            <div>
              <div className='flex items-center gap-2 mb-2'>
                <Image
                  src='/images/logo.png'
                  alt='ShiftTrack Logo'
                  width={24}
                  height={24}
                  className='h-6 w-6 rounded-lg dark:hidden'
                />
                <Image
                  src='/images/logo-dark.png'
                  alt='ShiftTrack Logo'
                  width={24}
                  height={24}
                  className='h-6 w-6 rounded-lg hidden dark:block'
                />
                <span className='font-bold text-xl'>ShiftTrack</span>
              </div>
              <p className='text-sm text-muted-foreground'>
                The simplest way to manage employee shifts and availability.
              </p>
            </div>
            <div>
              <h5 className='font-semibold mb-3'>Quick Links</h5>
              <ul className='space-y-2 text-sm'>
                <li>
                  <Link
                    href='#features'
                    className='text-muted-foreground hover:text-primary'
                  >
                    Features
                  </Link>
                </li>
                <li>
                  <Link
                    href='#why-choose-us'
                    className='text-muted-foreground hover:text-primary'
                  >
                    Why Choose Us
                  </Link>
                </li>
                <li>
                  <Link
                    href='#how-it-works'
                    className='text-muted-foreground hover:text-primary'
                  >
                    How It Works
                  </Link>
                </li>
                <li>
                  <Link
                    href='#faq'
                    className='text-muted-foreground hover:text-primary'
                  >
                    FAQs
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <h5 className='font-semibold mb-3'>Legal & Contact</h5>
              <ul className='space-y-2 text-sm'>
                <li>
                  <Link
                    href='/privacy'
                    className='text-muted-foreground hover:text-primary'
                  >
                    Privacy Policy
                  </Link>
                </li>
                <li>
                  <Link
                    href='/terms'
                    className='text-muted-foreground hover:text-primary'
                  >
                    Terms of Service
                  </Link>
                </li>
                <li>
                  <Link
                    href='/contact'
                    className='text-muted-foreground hover:text-primary'
                  >
                    Contact Us
                  </Link>
                </li>
              </ul>
            </div>
          </div>
          <div className='text-center text-muted-foreground text-sm border-t pt-8'>
            © {new Date().getFullYear()} ShiftTrack. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  )
}
