
export const translations = {
  en: {
    meta: {
      title: "Farhetkoun - Find Event Services",
      description: "Your one-stop marketplace to find and book services for your next event."
    },
    nav: {
        home: "Home",
        explore: "Explore",
        bookings: "Bookings",
        messages: "Messages",
        settings: "Settings",
        profile: "Profile",
        logout: "Log out",
        login: "Login",
        planner: "Planner",
        services: "Services",
        requests: "Requests",
    },
    common: {
      save: "Save",
      saving: "Saving...",
      cancel: "Cancel",
      delete: "Delete",
      edit: "Edit",
      confirm: "Confirm",
      bookNow: "Book Now",
      getAQuote: "Get a Quote",
      requestAQuote: "Request a Quote",
      sendRequest: "Send Request",
      sending: "Sending...",
      all: "All",
      services: "Services",
      offers: "Offers",
      view: "View",
      actionCancelled: "Action Cancelled",
      error: "Error",
      success: "Success",
      loading: "Loading...",
      home: "Home",
      explore: "Explore",
      bookings: "Bookings",
      messages: "Messages",
      settings: "Settings",
      profile: "Profile",
      logout: "Log out",
      login: "Login",
      signup: "Sign up",
    },
    loginPage: {
      mainTitle: "Farhetkoun",
      subtitle: "Your all-in-one marketplace for discovering, booking, and managing elite services for your next unforgettable event.",
      planYourEvent: "Plan Your Event",
      becomeAVendor: "Become a Vendor",
      findEverything: "Find Everything You Need",
      findEverythingSubtitle: "From grand venues to the smallest details, we've got you covered.",
      whyChoose: "Why Choose Farhetkoun?",
      whyChooseSubtitle: "We provide the tools and connections you need to create flawless events or grow your service business.",
      features: {
        aiPlanner: { title: "AI Event Planner", description: "Generate a complete, customized event timeline in seconds. Plan smarter, not harder." },
        marketplace: { title: "Diverse Marketplace", description: "Discover a wide range of top-tier services, from catering and photography to entertainment and decor." },
        showcase: { title: "Showcase Your Brand", description: "For vendors: create a stunning profile, upload your portfolio, and connect with a stream of new clients." },
        quoting: { title: "Effortless Quoting", description: "Request custom quotes from vendors through an integrated messaging system to get the perfect fit for your needs." },
        booking: { title: "Seamless Booking", description: "Book fixed-price offers instantly and manage all your appointments in a centralized calendar." },
        verified: { title: "Verified & Trusted", description: "Work with professionals. Read authentic reviews and see vendor portfolios to make informed decisions." },
      },
      signinTitle: "Sign In or Sign Up",
      signinSubtitle: "Start planning your event or offering your services.",
      emailLabel: "Email",
      passwordLabel: "Password",
      signinButton: "Sign In",
      noAccount: "Don't have an account?",
      signupNow: "Sign up now",
      footer: "© {year} Farhetkoun. All Rights Reserved."
    },
    clientBookings: {
        title: "My Bookings",
        description: "An overview of all your scheduled events and appointments.",
        history: {
            title: "Booking History",
            description: "Review past events and leave feedback for your vendors.",
            with: "with",
            reviewSubmitted: "Review Submitted",
            leaveReview: "Leave a Review"
        }
    },
    leaveReviewDialog: {
        title: "Leave a Review",
        description: "Share your experience with {vendorName} for the service '{serviceTitle}'.",
        commentPlaceholder: "How was your experience? What did you like or dislike?",
        submitButton: "Submit Review",
        errors: {
            notLoggedIn: "You must be logged in to leave a review.",
            ratingRequired: { title: "Rating Required", description: "Please select a star rating."},
            commentRequired: { title: "Comment Required", description: "Please enter a comment for your review."},
            submissionFailed: { title: "Review Failed", description: "Could not submit your review. Please try again."}
        },
        success: {
            title: "Review Submitted!",
            description: "Thank you for your feedback."
        }
    },
    clientProfile: {
        title: "My Profile",
        description: "Update your personal details and manage your account.",
        changePhoto: "Change photo",
        memberSince: "Member since",
        accountDetails: "Account Details",
        firstName: "First Name",
        lastName: "Last Name",
        email: "Email",
        phone: "Phone",
        mySavedItems: "My Saved Items",
        changePassword: "Change Password",
        notFound: {
            title: "User Not Found",
            description: "Could not load your profile. Please try logging in again."
        },
        dangerZone: {
            title: "Danger Zone",
            deleteAccount: "Delete My Account",
            areYouSure: "Are you absolutely sure?",
            description: "This action cannot be undone. This will permanently delete your account and remove your data from our servers."
        },
        updateSuccess: {
            title: "Profile Updated",
            description: "Your information has been saved successfully."
        },
        errors: {
            loadProfile: { title: "Error Loading Profile", description: "Could not fetch your profile data." },
            updateProfile: { title: "Update Failed", description: "Could not save your profile." },
            fileTooLarge: { title: "File Too Large", description: "Image must be less than 5MB." },
            invalidFileType: { title: "Invalid File Type", description: "Please select a JPG, PNG, or WEBP image." },
            imageProcessing: { title: "Image Error", description: "Could not process the image."}
        }
    },
    clientSaved: {
        title: "My Saved Items",
        description: "Your favorite services and offers, all in one place.",
        noItems: "You haven't saved any items yet."
    },
    offerCard: {
        badge: "Offer",
        priceLabel: "Fixed Price",
        reviews: "reviews",
        editOffer: "Edit Offer",
        saved: {
            title: "Item Saved!",
            description: "{title} has been added to your favorites."
        },
        unsaved: {
            title: "Item Unsaved",
            description: "{title} has been removed from your favorites."
        }
    },
    serviceCard: {
        reviews: "reviews",
        priceLabel: "Quote-based",
        editService: "Edit Service",
        saved: {
            title: "Item Saved!",
            description: "{title} has been added to your favorites."
        },
        unsaved: {
            title: "Item Unsaved",
            description: "{title} has been removed from your favorites."
        }
    },
    offerDetail: {
        backLink: "Back to all offers",
        offerBadge: "Special Offer",
        descriptionTitle: "About This Offer",
        whatsIncludedTitle: "What's Included",
        priceLabel: "Price",
        availability: "Check calendar for availability",
        aboutVendorTitle: "About the Vendor",
        reviews: "reviews",
        reviewsTitle: "Reviews",
        noReviews: "This vendor doesn't have any reviews yet.",
        notFound: {
            title: "Offer Not Found",
            description: "We couldn't find the offer you're looking for.",
            backButton: "Back to Explore"
        },
        includes: {
            hours: "Pre-defined hours of service",
            equipment: "All necessary equipment",
            staff: "Professional staff",
            travel: "Travel within specified area"
        }
    },
    serviceDetail: {
        backLink: "Back to all services",
        descriptionTitle: "About This Service",
        priceLabel: "Price on Request",
        priceDescription: "Contact vendor for a custom quote",
        aboutVendorTitle: "About the Vendor",
        reviews: "reviews",
        reviewsTitle: "Reviews",
        noReviews: "This vendor doesn't have any reviews yet.",
        notFound: {
            title: "Service Not Found",
            description: "We couldn't find the service you're looking for.",
            backButton: "Back to Explore"
        }
    },
    settings: {
        accountSettings: {
            title: "Account Settings",
            description: "Manage your account preferences.",
            email: "Email",
            changePassword: "Change Password"
        },
        vendorAccountSettings: {
            title: "Vendor Account Settings",
            description: "Manage your login and primary contact information.",
            ownerName: "Owner Full Name",
            loginEmail: "Login Email"
        },
        appearanceSettings: {
            title: "Appearance Settings",
            description: "Customize the look and feel of the application.",
            theme: {
                label: "Theme",
                light: "Light",
                dark: "Dark"
            },
            language: {
                label: "Language"
            }
        },
        notificationSettings: {
            title: "Notification Settings",
            description: "Choose how you want to be notified.",
            push: {
                label: "Push Notifications",
                description: "Get real-time updates on your mobile device."
            },
            email: {
                label: "Email Notifications"
            }
        },
        vendorNotificationSettings: {
             push: {
                description: "Get real-time updates on your mobile device about client activity."
            },
            email: {
                newMessages: "New messages from clients",
                quoteRequests: "New quote requests",
                newBookings: "New bookings and cancellations"
            }
        },
        clientNotificationSettings: {
            email: {
                newMessages: "New messages from vendors",
                quoteUpdates: "Updates on your quote requests",
                bookingConfirmations: "Booking confirmations and reminders",
                promotions: "Promotions and special offers"
            }
        },
        dangerZone: {
            title: "Danger Zone",
            description: "These actions are permanent and cannot be undone.",
            deleteAccount: "Delete My Account",
            deactivateProfile: "Deactivate My Vendor Profile",
            areYouSure: "Are you absolutely sure?",
            deleteDescription: "This action is permanent and cannot be undone. This will permanently delete your account and remove all your data from our servers.",
            deactivateDescription: "This will temporarily deactivate your profile, hiding it from public view. You can reactivate it later."
        }
    }
  },
  fr: {
    meta: {
      title: "Farhetkoun - Trouvez des Services Événementiels",
      description: "Votre marché unique pour trouver et réserver des services pour votre prochain événement."
    },
     nav: {
        home: "Accueil",
        explore: "Explorer",
        bookings: "Réservations",
        messages: "Messages",
        settings: "Paramètres",
        profile: "Profil",
        logout: "Déconnexion",
        login: "Connexion",
        planner: "Planificateur",
        services: "Services",
        requests: "Demandes",
    },
    common: {
      save: "Enregistrer",
      saving: "Enregistrement...",
      cancel: "Annuler",
      delete: "Supprimer",
      edit: "Modifier",
      confirm: "Confirmer",
      bookNow: "Réserver maintenant",
      getAQuote: "Obtenir un devis",
      requestAQuote: "Demander un devis",
      sendRequest: "Envoyer la demande",
      sending: "Envoi...",
      all: "Tout",
      services: "Services",
      offers: "Offres",
      view: "Voir",
      actionCancelled: "Action annulée",
      error: "Erreur",
      success: "Succès",
      loading: "Chargement...",
      home: "Accueil",
      explore: "Explorer",
      bookings: "Réservations",
      messages: "Messages",
      settings: "Paramètres",
      profile: "Profil",
      logout: "Déconnexion",
      login: "Connexion",
      signup: "S'inscrire",
    },
    loginPage: {
      mainTitle: "Farhetkoun",
      subtitle: "Votre marché tout-en-un pour découvrir, réserver et gérer des services d'élite pour votre prochain événement inoubliable.",
      planYourEvent: "Planifiez votre événement",
      becomeAVendor: "Devenez un fournisseur",
      findEverything: "Trouvez tout ce dont vous avez besoin",
      findEverythingSubtitle: "Des lieux grandioses aux plus petits détails, nous nous occupons de tout.",
      whyChoose: "Pourquoi choisir Farhetkoun ?",
      whyChooseSubtitle: "Nous fournissons les outils et les connexions nécessaires pour créer des événements parfaits ou développer votre entreprise de services.",
      features: {
        aiPlanner: { title: "Planificateur d'événements IA", description: "Générez une chronologie d'événement complète et personnalisée en quelques secondes. Planifiez plus intelligemment." },
        marketplace: { title: "Marché diversifié", description: "Découvrez une large gamme de services haut de gamme, de la restauration à la décoration, en passant par la photographie." },
        showcase: { title: "Mettez en valeur votre marque", description: "Pour les fournisseurs : créez un profil époustouflant, téléchargez votre portfolio et connectez-vous avec de nouveaux clients." },
        quoting: { title: "Devis sans effort", description: "Demandez des devis personnalisés aux fournisseurs via une messagerie intégrée pour trouver l'offre parfaite." },
        booking: { title: "Réservation facile", description: "Réservez des offres à prix fixe instantanément et gérez tous vos rendez-vous dans un calendrier centralisé." },
        verified: { title: "Vérifié et fiable", description: "Travaillez avec des professionnels. Lisez des avis authentiques et consultez les portfolios des fournisseurs." },
      },
      signinTitle: "Se connecter ou s'inscrire",
      signinSubtitle: "Commencez à planifier votre événement ou à offrir vos services.",
      emailLabel: "Email",
      passwordLabel: "Mot de passe",
      signinButton: "Se connecter",
      noAccount: "Vous n'avez pas de compte ?",
      signupNow: "Inscrivez-vous maintenant",
      footer: "© {year} Farhetkoun. Tous droits réservés."
    },
     clientBookings: {
        title: "Mes Réservations",
        description: "Un aperçu de tous vos événements et rendez-vous programmés.",
        history: {
            title: "Historique des réservations",
            description: "Consultez les événements passés et laissez des commentaires à vos fournisseurs.",
            with: "avec",
            reviewSubmitted: "Avis soumis",
            leaveReview: "Laisser un avis"
        }
    },
    leaveReviewDialog: {
        title: "Laisser un avis",
        description: "Partagez votre expérience avec {vendorName} pour le service '{serviceTitle}'.",
        commentPlaceholder: "Comment s'est passée votre expérience ? Qu'avez-vous aimé ou non ?",
        submitButton: "Envoyer l'avis",
        errors: {
            notLoggedIn: "Vous devez être connecté pour laisser un avis.",
            ratingRequired: { title: "Note requise", description: "Veuillez sélectionner une note en étoiles."},
            commentRequired: { title: "Commentaire requis", description: "Veuillez saisir un commentaire pour votre avis."},
            submissionFailed: { title: "Échec de l'envoi", description: "Impossible d'envoyer votre avis. Veuillez réessayer."}
        },
        success: {
            title: "Avis soumis !",
            description: "Merci pour vos commentaires."
        }
    },
    clientProfile: {
        title: "Mon Profil",
        description: "Mettez à jour vos informations personnelles et gérez votre compte.",
        changePhoto: "Changer la photo",
        memberSince: "Membre depuis",
        accountDetails: "Détails du compte",
        firstName: "Prénom",
        lastName: "Nom de famille",
        email: "Email",
        phone: "Téléphone",
        mySavedItems: "Mes éléments enregistrés",
        changePassword: "Changer le mot de passe",
        notFound: {
            title: "Utilisateur non trouvé",
            description: "Impossible de charger votre profil. Veuillez réessayer de vous connecter."
        },
        dangerZone: {
            title: "Zone de danger",
            deleteAccount: "Supprimer mon compte",
            areYouSure: "Êtes-vous absolument sûr(e) ?",
            description: "Cette action est irréversible. Cela supprimera définitivement votre compte et vos données."
        },
        updateSuccess: {
            title: "Profil mis à jour",
            description: "Vos informations ont été enregistrées avec succès."
        },
        errors: {
            loadProfile: { title: "Erreur de chargement du profil", description: "Impossible de récupérer les données de votre profil." },
            updateProfile: { title: "Échec de la mise à jour", description: "Impossible d'enregistrer votre profil." },
            fileTooLarge: { title: "Fichier trop volumineux", description: "L'image doit faire moins de 5 Mo." },
            invalidFileType: { title: "Type de fichier invalide", description: "Veuillez sélectionner une image JPG, PNG ou WEBP." },
            imageProcessing: { title: "Erreur d'image", description: "Impossible de traiter l'image."}
        }
    },
    clientSaved: {
        title: "Mes éléments enregistrés",
        description: "Vos services et offres préférés, tous au même endroit.",
        noItems: "Vous n'avez encore enregistré aucun élément."
    },
    offerCard: {
        badge: "Offre",
        priceLabel: "Prix fixe",
        reviews: "avis",
        editOffer: "Modifier l'offre",
        saved: {
            title: "Élément enregistré !",
            description: "{title} a été ajouté à vos favoris."
        },
        unsaved: {
            title: "Élément non enregistré",
            description: "{title} a été retiré de vos favoris."
        }
    },
    serviceCard: {
        reviews: "avis",
        priceLabel: "Sur devis",
        editService: "Modifier le service",
        saved: {
            title: "Élément enregistré !",
            description: "{title} a été ajouté à vos favoris."
        },
        unsaved: {
            title: "Élément non enregistré",
            description: "{title} a été retiré de vos favoris."
        }
    },
    offerDetail: {
        backLink: "Retour à toutes les offres",
        offerBadge: "Offre Spéciale",
        descriptionTitle: "À propos de cette offre",
        whatsIncludedTitle: "Ce qui est inclus",
        priceLabel: "Prix",
        availability: "Consultez le calendrier pour les disponibilités",
        aboutVendorTitle: "À propos du vendeur",
        reviews: "avis",
        reviewsTitle: "Avis",
        noReviews: "Ce vendeur n'a pas encore d'avis.",
        notFound: {
            title: "Offre non trouvée",
            description: "Nous n'avons pas pu trouver l'offre que vous recherchez.",
            backButton: "Retour à l'exploration"
        },
        includes: {
            hours: "Heures de service prédéfinies",
            equipment: "Tout l'équipement nécessaire",
            staff: "Personnel professionnel",
            travel: "Déplacement dans la zone spécifiée"
        }
    },
    serviceDetail: {
        backLink: "Retour à tous les services",
        descriptionTitle: "À propos de ce service",
        priceLabel: "Prix sur demande",
        priceDescription: "Contactez le vendeur pour un devis personnalisé",
        aboutVendorTitle: "À propos du vendeur",
        reviews: "avis",
        reviewsTitle: "Avis",
        noReviews: "Ce vendeur n'a pas encore d'avis.",
        notFound: {
            title: "Service non trouvé",
            description: "Nous n'avons pas pu trouver le service que vous recherchez.",
            backButton: "Retour à l'exploration"
        }
    },
    settings: {
        accountSettings: {
            title: "Paramètres du compte",
            description: "Gérez les préférences de votre compte.",
            email: "Email",
            changePassword: "Changer le mot de passe"
        },
        vendorAccountSettings: {
            title: "Paramètres du compte vendeur",
            description: "Gérez vos informations de connexion et de contact principales.",
            ownerName: "Nom complet du propriétaire",
            loginEmail: "Email de connexion"
        },
        appearanceSettings: {
            title: "Paramètres d'apparence",
            description: "Personnalisez l'apparence de l'application.",
            theme: {
                label: "Thème",
                light: "Clair",
                dark: "Sombre"
            },
            language: {
                label: "Langue"
            }
        },
        notificationSettings: {
            title: "Paramètres de notification",
            description: "Choisissez comment vous souhaitez être notifié.",
            push: {
                label: "Notifications push",
                description: "Recevez des mises à jour en temps réel sur votre appareil mobile."
            },
            email: {
                label: "Notifications par email"
            }
        },
        vendorNotificationSettings: {
            push: {
                description: "Recevez des mises à jour en temps réel sur l'activité de vos clients."
            },
            email: {
                newMessages: "Nouveaux messages des clients",
                quoteRequests: "Nouvelles demandes de devis",
                newBookings: "Nouvelles réservations et annulations"
            }
        },
        clientNotificationSettings: {
            email: {
                newMessages: "Nouveaux messages des fournisseurs",
                quoteUpdates: "Mises à jour de vos demandes de devis",
                bookingConfirmations: "Confirmations et rappels de réservation",
                promotions: "Promotions et offres spéciales"
            }
        },
        dangerZone: {
            title: "Zone de danger",
            description: "Ces actions sont permanentes et ne peuvent pas être annulées.",
            deleteAccount: "Supprimer mon compte",
            deactivateProfile: "Désactiver mon profil vendeur",
            areYouSure: "Êtes-vous absolument certain(e) ?",
            deleteDescription: "Cette action est permanente et irréversible. Elle supprimera définitivement votre compte et toutes vos données de nos serveurs.",
            deactivateDescription: "Cela désactivera temporairement votre profil, le cachant de la vue publique. Vous pourrez le réactiver plus tard."
        }
    }
  },
  ar: {
    meta: {
      title: "فرحتكم - ابحث عن خدمات المناسبات",
      description: "سوقك المتكامل للعثور على خدمات وحجزها لمناسبتك القادمة."
    },
    nav: {
        home: "الرئيسية",
        explore: "استكشف",
        bookings: "الحجوزات",
        messages: "الرسائل",
        settings: "الإعدادات",
        profile: "الملف الشخصي",
        logout: "تسجيل الخروج",
        login: "تسجيل الدخول",
        planner: "المخطط",
        services: "الخدمات",
        requests: "الطلبات",
    },
    common: {
      save: "حفظ",
      saving: "جارٍ الحفظ...",
      cancel: "إلغاء",
      delete: "حذف",
      edit: "تعديل",
      confirm: "تأكيد",
      bookNow: "احجز الآن",
      getAQuote: "احصل على عرض سعر",
      requestAQuote: "اطلب عرض سعر",
      sendRequest: "إرسال الطلب",
      sending: "جارٍ الإرسال...",
      all: "الكل",
      services: "خدمات",
      offers: "عروض",
      view: "عرض",
      actionCancelled: "تم إلغاء الإجراء",
      error: "خطأ",
      success: "نجاح",
      loading: "تحميل...",
      home: "الرئيسية",
      explore: "استكشف",
      bookings: "الحجوزات",
      messages: "الرسائل",
      settings: "الإعدادات",
      profile: "الملف الشخصي",
      logout: "تسجيل الخروج",
      login: "تسجيل الدخول",
      signup: "إنشاء حساب",
    },
    loginPage: {
      mainTitle: "فرحتكم",
      subtitle: "سوقك المتكامل لاكتشاف وحجز وإدارة الخدمات المتميزة لمناسبتك القادمة التي لا تُنسى.",
      planYourEvent: "خطط لمناسبتك",
      becomeAVendor: "كن بائعًا",
      findEverything: "ابحث عن كل ما تحتاجه",
      findEverythingSubtitle: "من الأماكن الكبيرة إلى أصغر التفاصيل، لدينا كل شيء.",
      whyChoose: "لماذا تختار فرحتكم؟",
      whyChooseSubtitle: "نوفر لك الأدوات والاتصالات التي تحتاجها لإنشاء مناسبات لا تشوبها شائبة أو لتنمية أعمالك الخدمية.",
      features: {
        aiPlanner: { title: "مخطط مناسبات بالذكاء الاصطناعي", description: "أنشئ جدولًا زمنيًا كاملاً ومخصصًا للمناسبات في ثوانٍ. خطط بذكاء أكبر." },
        marketplace: { title: "سوق متنوع", description: "اكتشف مجموعة واسعة من الخدمات الراقية، من التموين والتصوير إلى الترفيه والديكور." },
        showcase: { title: "اعرض علامتك التجارية", description: "للبائعين: أنشئ ملفًا شخصيًا مذهلاً، وقم بتحميل أعمالك، وتواصل مع عملاء جدد." },
        quoting: { title: "عروض أسعار سهلة", description: "اطلب عروض أسعار مخصصة من البائعين عبر نظام مراسلة متكامل للحصول على ما يناسب احتياجاتك." },
        booking: { title: "حجز سلس", description: "احجز العروض ذات الأسعار الثابتة على الفور وأدر جميع مواعيدك في تقويم مركزي." },
        verified: { title: "موثوق ومعتمد", description: "تعامل مع محترفين. اقرأ تقييمات حقيقية واطلع على أعمال البائعين لاتخاذ قرارات مستنيرة." },
      },
      signinTitle: "تسجيل الدخول أو إنشاء حساب",
      signinSubtitle: "ابدأ في التخطيط لمناسبتك أو تقديم خدماتك.",
      emailLabel: "البريد الإلكتروني",
      passwordLabel: "كلمة المرور",
      signinButton: "تسجيل الدخول",
      noAccount: "ليس لديك حساب؟",
      signupNow: "أنشئ حسابًا الآن",
      footer: "© {year} فرحتكم. جميع الحقوق محفوظة."
    },
     clientBookings: {
        title: "حجوزاتي",
        description: "نظرة عامة على جميع الفعاليات والمواعيد المجدولة.",
        history: {
            title: "سجل الحجوزات",
            description: "راجع الفعاليات السابقة واترك تقييمًا للبائعين.",
            with: "مع",
            reviewSubmitted: "تم تقديم التقييم",
            leaveReview: "اترك تقييمًا"
        }
    },
    leaveReviewDialog: {
        title: "اترك تقييمًا",
        description: "شارك تجربتك مع {vendorName} لخدمة '{serviceTitle}'.",
        commentPlaceholder: "كيف كانت تجربتك؟ ما الذي أعجبك أو لم يعجبك؟",
        submitButton: "إرسال التقييم",
        errors: {
            notLoggedIn: "يجب عليك تسجيل الدخول لترك تقييم.",
            ratingRequired: { title: "التقييم مطلوب", description: "يرجى تحديد تقييم بالنجوم."},
            commentRequired: { title: "التعليق مطلوب", description: "يرجى إدخال تعليق لتقييمك."},
            submissionFailed: { title: "فشل إرسال التقييم", description: "تعذر إرسال تقييمك. يرجى المحاولة مرة أخرى."}
        },
        success: {
            title: "تم إرسال التقييم!",
            description: "شكرًا لك على ملاحظاتك."
        }
    },
     clientProfile: {
        title: "ملفي الشخصي",
        description: "قم بتحديث بياناتك الشخصية وإدارة حسابك.",
        changePhoto: "تغيير الصورة",
        memberSince: "عضو منذ",
        accountDetails: "تفاصيل الحساب",
        firstName: "الاسم الأول",
        lastName: "اسم العائلة",
        email: "البريد الإلكتروني",
        phone: "الهاتف",
        mySavedItems: "العناصر المحفوظة",
        changePassword: "تغيير كلمة المرور",
        notFound: {
            title: "المستخدم غير موجود",
            description: "لم نتمكن من تحميل ملفك الشخصي. يرجى محاولة تسجيل الدخول مرة أخرى."
        },
        dangerZone: {
            title: "منطقة الخطر",
            deleteAccount: "حذف حسابي",
            areYouSure: "هل أنت متأكد تمامًا؟",
            description: "هذا الإجراء لا يمكن التراجع عنه. سيؤدي هذا إلى حذف حسابك وبياناتك بشكل دائم."
        },
        updateSuccess: {
            title: "تم تحديث الملف الشخصي",
            description: "تم حفظ معلوماتك بنجاح."
        },
        errors: {
            loadProfile: { title: "خطأ في تحميل الملف الشخصي", description: "تعذر جلب بيانات ملفك الشخصي." },
            updateProfile: { title: "فشل التحديث", description: "تعذر حفظ ملفك الشخصي." },
            fileTooLarge: { title: "الملف كبير جدًا", description: "يجب أن يكون حجم الصورة أقل من 5 ميغابايت." },
            invalidFileType: { title: "نوع الملف غير صالح", description: "يرجى تحديد صورة من نوع JPG أو PNG أو WEBP." },
            imageProcessing: { title: "خطأ في الصورة", description: "تعذر معالجة الصورة."}
        }
    },
    clientSaved: {
        title: "العناصر المحفوظة",
        description: "خدماتك وعروضك المفضلة في مكان واحد.",
        noItems: "لم تقم بحفظ أي عناصر بعد."
    },
     offerCard: {
        badge: "عرض",
        priceLabel: "سعر ثابت",
        reviews: "تقييمات",
        editOffer: "تعديل العرض",
        saved: {
            title: "تم حفظ العنصر!",
            description: "تمت إضافة {title} إلى مفضلتك."
        },
        unsaved: {
            title: "تم إلغاء حفظ العنصر",
            description: "تمت إزالة {title} من مفضلتك."
        }
    },
    serviceCard: {
        reviews: "تقييمات",
        priceLabel: "حسب الطلب",
        editService: "تعديل الخدمة",
        saved: {
            title: "تم حفظ العنصر!",
            description: "تمت إضافة {title} إلى مفضلتك."
        },
        unsaved: {
            title: "تم إلغاء حفظ العنصر",
            description: "تمت إزالة {title} من مفضلتك."
        }
    },
    offerDetail: {
        backLink: "العودة إلى كل العروض",
        offerBadge: "عرض خاص",
        descriptionTitle: "عن هذا العرض",
        whatsIncludedTitle: "ماذا يتضمن",
        priceLabel: "السعر",
        availability: "تحقق من التقويم للتوافر",
        aboutVendorTitle: "عن البائع",
        reviews: "تقييمات",
        reviewsTitle: "التقييمات",
        noReviews: "لا توجد تقييمات لهذا البائع بعد.",
        notFound: {
            title: "العرض غير موجود",
            description: "لم نتمكن من العثور على العرض الذي تبحث عنه.",
            backButton: "العودة للاستكشاف"
        },
        includes: {
            hours: "ساعات خدمة محددة مسبقًا",
            equipment: "جميع المعدات اللازمة",
            staff: "طاقم عمل محترف",
            travel: "التنقل داخل المنطقة المحددة"
        }
    },
    serviceDetail: {
        backLink: "العودة إلى كل الخدمات",
        descriptionTitle: "عن هذه الخدمة",
        priceLabel: "السعر عند الطلب",
        priceDescription: "اتصل بالبائع للحصول على عرض سعر مخصص",
        aboutVendorTitle: "عن البائع",
        reviews: "تقييمات",
        reviewsTitle: "التقييمات",
        noReviews: "لا توجد تقييمات لهذا البائع بعد.",
        notFound: {
            title: "الخدمة غير موجودة",
            description: "لم نتمكن من العثور على الخدمة التي تبحث عنها.",
            backButton: "العودة للاستكشاف"
        }
    },
    settings: {
        accountSettings: {
            title: "إعدادات الحساب",
            description: "إدارة تفضيلات حسابك.",
            email: "البريد الإلكتروني",
            changePassword: "تغيير كلمة المرور"
        },
        vendorAccountSettings: {
            title: "إعدادات حساب البائع",
            description: "إدارة معلومات تسجيل الدخول والاتصال الأساسية.",
            ownerName: "اسم المالك الكامل",
            loginEmail: "البريد الإلكتروني لتسجيل الدخول"
        },
        appearanceSettings: {
            title: "إعدادات المظهر",
            description: "تخصيص شكل ومظهر التطبيق.",
            theme: {
                label: "المظهر",
                light: "فاتح",
                dark: "داكن"
            },
            language: {
                label: "اللغة"
            }
        },
        notificationSettings: {
            title: "إعدادات الإشعارات",
            description: "اختر كيف تريد أن يتم إعلامك.",
            push: {
                label: "إشعارات لحظية",
                description: "احصل على تحديثات في الوقت الفعلي على جهازك المحمول."
            },
            email: {
                label: "إشعارات البريد الإلكتروني"
            }
        },
        vendorNotificationSettings: {
            push: {
                description: "احصل على تحديثات في الوقت الفعلي حول نشاط العميل."
            },
            email: {
                newMessages: "رسائل جديدة من العملاء",
                quoteRequests: "طلبات عروض أسعار جديدة",
                newBookings: "حجوزات وإلغاءات جديدة"
            }
        },
        clientNotificationSettings: {
            email: {
                newMessages: "رسائل جديدة من البائعين",
                quoteUpdates: "تحديثات على طلبات عروض الأسعار الخاصة بك",
                bookingConfirmations: "تأكيدات الحجز والتذكيرات",
                promotions: "العروض الترويجية والعروض الخاصة"
            }
        },
        dangerZone: {
            title: "منطقة الخطر",
            description: "هذه الإجراءات دائمة ولا يمكن التراجع عنها.",
            deleteAccount: "حذف حسابي",
            deactivateProfile: "إلغاء تنشيط ملفي الشخصي كبائع",
            areYouSure: "هل أنت متأكد تمامًا؟",
            deleteDescription: "هذا الإجراء دائم ولا يمكن التراجع عنه. سيؤدي هذا إلى حذف حسابك نهائيًا وإزالة جميع بياناتك من خوادمنا.",
            deactivateDescription: "سيؤدي هذا إلى إلغاء تنشيط ملفك الشخصي مؤقتًا، وإخفائه عن العرض العام. يمكنك إعادة تنشيطه لاحقًا."
        }
    }
  }
};

export type TranslationType = typeof translations.en;
