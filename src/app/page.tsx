"use client"

import { useUser } from "@/hooks/use-user"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Loader2, Star, Users, Clock, ArrowRight, BookOpen, Zap, Shield } from "lucide-react"
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import Link from "next/link"
import Image from "next/image"

export default function Home() {
  const { user, userData, isLoading } = useUser()
  const router = useRouter()
  const [showProfileCompletionDialog, setShowProfileCompletionDialog] = useState(false)

  useEffect(() => {
    if (!isLoading && !user) {
      // User is not logged in, this is the landing page
    } else if (!isLoading && user && userData) {
      if (userData.isProfileCompleted === false) {
        setShowProfileCompletionDialog(true)
      } else {
        setShowProfileCompletionDialog(false)
      }
    }
  }, [user, userData, isLoading, router])

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-16 w-16 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="flex flex-col bg-background">
      <Header />
      <main>
        {/* Hero Section */}
        <section className="relative bg-gradient-to-br from-blue-50 via-white to-indigo-50 pt-20 px-20 pb-10 lg:pt-[50px] lg:pb-20 overflow-hidden">
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            <div className="absolute -top-40 -right-40 w-80 h-80 bg-blue-200 rounded-full mix-blend-multiply filter blur-3xl opacity-20"></div>
            <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-indigo-200 rounded-full mix-blend-multiply filter blur-3xl opacity-20"></div>
          </div>
          <div className="container mx-auto relative z-10">
            <div className="flex justify-between flex-wrap items-center -mx-4">
              <div className="w-full px-4 lg:w-1/2">
                <div className="lg:py-12">
                  <div className="inline-block mb-4 px-4 py-2 bg-blue-100 rounded-full">
                    <span className="text-sm font-semibold text-blue-700">✨ Join 50,000+ Learners</span>
                  </div>
                  <h1 className="mb-6 text-4xl font-bold leading-snug text-gray-900 sm:text-5xl sm:leading-snug lg:text-6xl lg:leading-tight text-balance">
                    Find Your Perfect Tutor.
                    <span className="block text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600">
                      Today.
                    </span>
                  </h1>
                  <p className="mb-8 max-w-[480px] text-base text-gray-600 leading-relaxed">
                    LearnSphere connects you with expert tutors in your area for personalized, one-on-one learning.
                    Master any subject at your own pace.
                  </p>
                  <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                    <Button
                      asChild
                      size="lg"
                      className="rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white"
                    >
                      <Link href="/signup" className="flex items-center gap-2">
                        Get Started <ArrowRight className="w-4 h-4" />
                      </Link>
                    </Button>
                    <Button asChild size="lg" variant="outline" className="rounded-xl bg-transparent">
                      <Link href="#features">Learn More</Link>
                    </Button>
                  </div>
                  <div className="mt-8 flex items-center gap-6 text-sm text-gray-600">
                    <div className="flex items-center gap-2">
                      <Star className="w-5 h-5 fill-yellow-400 text-yellow-400" />
                      <span>4.9/5 Rating</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Users className="w-5 h-5 text-blue-600" />
                      <span>10K+ Tutors</span>
                    </div>
                  </div>
                </div>
              </div>
              <div className="hidden px-4 lg:block lg:w-[40%]">
                <div className="relative">
                  <div className="absolute inset-0 bg-gradient-to-r from-blue-400 to-indigo-400 rounded-2xl blur-2xl opacity-20"></div>
                  <Image
                    src="/slt.jpg"
                    alt="Students learning together"
                    width={700}
                    height={600}
                    className="rounded-2xl shadow-2xl relative z-10"
                  />
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Stats Section */}
        <section className="py-12 lg:py-16 bg-white border-b border-gray-200">
          <div className="container mx-auto px-4">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
              <div className="text-center">
                <div className="text-3xl lg:text-4xl font-bold text-blue-600 mb-2">50K+</div>
                <p className="text-gray-600">Active Learners</p>
              </div>
              <div className="text-center">
                <div className="text-3xl lg:text-4xl font-bold text-indigo-600 mb-2">10K+</div>
                <p className="text-gray-600">Expert Tutors</p>
              </div>
              <div className="text-center">
                <div className="text-3xl lg:text-4xl font-bold text-blue-600 mb-2">500+</div>
                <p className="text-gray-600">Subjects Covered</p>
              </div>
              <div className="text-center">
                <div className="text-3xl lg:text-4xl font-bold text-indigo-600 mb-2">100K+</div>
                <p className="text-gray-600">Sessions Completed</p>
              </div>
            </div>
          </div>
        </section>

        {/* About Us Section */}
        <section id="about" className="py-20 lg:py-32 bg-gray-50">
          <div className="container mx-auto px-4">
            <div className="mx-auto max-w-3xl text-center">
              <h2 className="text-3xl font-bold text-gray-900 sm:text-4xl mb-6">About LearnSphere</h2>
              <p className="text-lg text-gray-600 leading-relaxed mb-8">
                We believe that quality education should be accessible to everyone. Our mission is to bridge the gap
                between knowledgeable tutors and eager students, creating a vibrant community of learners and educators.
                LearnSphere provides a secure, intuitive platform for finding and booking tutoring sessions that fit
                your schedule and learning style.
              </p>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-12">
                <div className="p-6 bg-white rounded-xl border border-gray-200">
                  <BookOpen className="w-8 h-8 text-blue-600 mx-auto mb-4" />
                  <h3 className="font-semibold text-gray-900 mb-2">Personalized Learning</h3>
                  <p className="text-sm text-gray-600">
                    Tailored lessons designed for your unique learning style and pace.
                  </p>
                </div>
                <div className="p-6 bg-white rounded-xl border border-gray-200">
                  <Zap className="w-8 h-8 text-indigo-600 mx-auto mb-4" />
                  <h3 className="font-semibold text-gray-900 mb-2">Quick Booking</h3>
                  <p className="text-sm text-gray-600">
                    Find and book sessions in minutes with our intuitive platform.
                  </p>
                </div>
                <div className="p-6 bg-white rounded-xl border border-gray-200">
                  <Shield className="w-8 h-8 text-blue-600 mx-auto mb-4" />
                  <h3 className="font-semibold text-gray-900 mb-2">Safe & Secure</h3>
                  <p className="text-sm text-gray-600">Verified tutors and secure payments for peace of mind.</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section id="features" className="py-20 lg:py-32 bg-white">
          <div className="container mx-auto px-4">
            <div className="mx-auto max-w-3xl text-center mb-16">
              <h2 className="text-3xl font-bold text-gray-900 sm:text-4xl mb-4">Why Choose LearnSphere?</h2>
              <p className="text-lg text-gray-600">Personalized learning experiences tailored just for you.</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="p-8 border border-gray-200 rounded-2xl hover:shadow-lg hover:border-blue-200 transition-all duration-300 group">
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4 group-hover:bg-blue-600 transition-colors">
                  <Users className="w-6 h-6 text-blue-600 group-hover:text-white" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-3">Expert Tutors</h3>
                <p className="text-gray-600 leading-relaxed">
                  Access a wide range of verified and experienced tutors for any subject. All tutors are
                  background-checked and highly rated.
                </p>
                <div className="mt-4 flex items-center text-blue-600 font-semibold text-sm">
                  Learn more <ArrowRight className="w-4 h-4 ml-2" />
                </div>
              </div>
              <div className="p-8 border border-gray-200 rounded-2xl hover:shadow-lg hover:border-indigo-200 transition-all duration-300 group">
                <div className="w-12 h-12 bg-indigo-100 rounded-lg flex items-center justify-center mb-4 group-hover:bg-indigo-600 transition-colors">
                  <Clock className="w-6 h-6 text-indigo-600 group-hover:text-white" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-3">Flexible Scheduling</h3>
                <p className="text-gray-600 leading-relaxed">
                  Find and book sessions that fit your busy schedule. Choose between online or in-person tutoring based
                  on your preference.
                </p>
                <div className="mt-4 flex items-center text-indigo-600 font-semibold text-sm">
                  Learn more <ArrowRight className="w-4 h-4 ml-2" />
                </div>
              </div>
              <div className="p-8 border border-gray-200 rounded-2xl hover:shadow-lg hover:border-blue-200 transition-all duration-300 group">
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4 group-hover:bg-blue-600 transition-colors">
                  <Shield className="w-6 h-6 text-blue-600 group-hover:text-white" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-3">Secure Platform</h3>
                <p className="text-gray-600 leading-relaxed">
                  A safe and reliable environment for payments, communication, and learning. Your data is encrypted and
                  protected.
                </p>
                <div className="mt-4 flex items-center text-blue-600 font-semibold text-sm">
                  Learn more <ArrowRight className="w-4 h-4 ml-2" />
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* How It Works Section */}
        <section className="py-20 lg:py-32 bg-gray-50">
          <div className="container mx-auto px-4">
            <div className="mx-auto max-w-3xl text-center mb-16">
              <h2 className="text-3xl font-bold text-gray-900 sm:text-4xl mb-4">How It Works</h2>
              <p className="text-lg text-gray-600">Get started in just 4 simple steps.</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
              {[
                { step: 1, title: "Sign Up", desc: "Create your account in seconds" },
                { step: 2, title: "Browse Tutors", desc: "Explore verified tutors by subject" },
                { step: 3, title: "Book Session", desc: "Schedule at your convenience" },
                { step: 4, title: "Learn & Grow", desc: "Start your learning journey" },
              ].map((item) => (
                <div key={item.step} className="relative">
                  <div className="flex flex-col items-center">
                    <div className="w-16 h-16 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-full flex items-center justify-center text-white font-bold text-xl mb-4 shadow-lg">
                      {item.step}
                    </div>
                    <h3 className="text-lg font-bold text-gray-900 mb-2">{item.title}</h3>
                    <p className="text-gray-600 text-center text-sm">{item.desc}</p>
                  </div>
                  {item.step < 4 && (
                    <div className="hidden md:block absolute top-8 -right-4 w-8 h-1 bg-gradient-to-r from-blue-600 to-indigo-600"></div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Testimonials Section */}
        <section className="py-20 lg:py-32 bg-white">
          <div className="container mx-auto px-4">
            <div className="mx-auto max-w-3xl text-center mb-16">
              <h2 className="text-3xl font-bold text-gray-900 sm:text-4xl mb-4">What Our Users Say</h2>
              <p className="text-lg text-gray-600">Join thousands of satisfied students and tutors.</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {[
                {
                  name: "Sarah Johnson",
                  role: "Student",
                  content:
                    "LearnSphere helped me improve my math grades from C to A. The tutors are incredibly patient and knowledgeable!",
                  rating: 5,
                },
                {
                  name: "Michael Chen",
                  role: "Tutor",
                  content:
                    "As a tutor, I love the flexibility and the quality of students on the platform. It's a great way to make an impact.",
                  rating: 5,
                },
                {
                  name: "Emma Davis",
                  role: "Student",
                  content:
                    "The booking process is so easy, and I found the perfect tutor for my SAT prep. Highly recommended!",
                  rating: 5,
                },
              ].map((testimonial, idx) => (
                <div
                  key={idx}
                  className="p-8 bg-gray-50 rounded-2xl border border-gray-200 hover:shadow-lg transition-shadow"
                >
                  <div className="flex gap-1 mb-4">
                    {[...Array(testimonial.rating)].map((_, i) => (
                      <Star key={i} className="w-5 h-5 fill-yellow-400 text-yellow-400" />
                    ))}
                  </div>
                  <p className="text-gray-700 mb-6 leading-relaxed">"{testimonial.content}"</p>
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-gradient-to-br from-blue-400 to-indigo-400 rounded-full"></div>
                    <div>
                      <p className="font-semibold text-gray-900">{testimonial.name}</p>
                      <p className="text-sm text-gray-600">{testimonial.role}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-20 lg:py-32 bg-gradient-to-r from-blue-600 to-indigo-600">
          <div className="container mx-auto px-4 text-center">
            <h2 className="text-3xl font-bold text-white sm:text-4xl mb-6">Ready to Transform Your Learning?</h2>
            <p className="text-xl text-blue-100 mb-8 max-w-2xl mx-auto">
              Join thousands of students already achieving their academic goals with LearnSphere.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button asChild size="lg" className="rounded-xl bg-white text-blue-600 hover:bg-gray-100">
                <Link href="/signup">Get Started Free</Link>
              </Button>
              <Button
                asChild
                size="lg"
                variant="outline"
                className="rounded-xl border-white text-white hover:bg-white/10 bg-transparent"
              >
                <Link href="#about">Learn More</Link>
              </Button>
            </div>
          </div>
        </section>
      </main>

      <Dialog open={showProfileCompletionDialog} onOpenChange={setShowProfileCompletionDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Complete Your Profile</DialogTitle>
            <DialogDescription>
              Please update your profile information to get the most out of LearnSphere.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowProfileCompletionDialog(false)}>
              Later
            </Button>
            <Button asChild>
              <Link href="/profile">Go to Profile</Link>
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Footer />
    </div>
  )
}
