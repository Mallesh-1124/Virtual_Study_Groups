from django.core.management.base import BaseCommand
from django.contrib.auth.models import User
from api.models import StudyRoom

class Command(BaseCommand):
    help = 'Creates a set of initial study rooms'

    def handle(self, *args, **kwargs):
        # Get or create an admin user to be the creator
        admin_user = User.objects.filter(is_superuser=True).first()
        if not admin_user:
            admin_user, created = User.objects.get_or_create(
                username='admin',
                defaults={'email': 'admin@example.com', 'is_staff': True, 'is_superuser': True}
            )
            if created:
                admin_user.set_password('admin123')
                admin_user.save()

        rooms_data = [
            {
                "name": "Advanced Calculus Group",
                "subject": "Mathematics",
                "description": "A collaborative space for solving complex integrals, differential equations, and discussing advanced calculus topics.",
                "capacity": 20,
                "ai_teaching_style": "socratic",
            },
            {
                "name": "Machine Learning & AI",
                "subject": "Computer Science",
                "description": "Discuss algorithms, neural networks, PyTorch/TensorFlow, and prepare for ML interviews.",
                "capacity": 30,
                "ai_teaching_style": "direct",
            },
            {
                "name": "Physics 101 Midterm Prep",
                "subject": "Physics",
                "description": "Preparing for the upcoming physics midterm. Focus on mechanics, kinematics, and energy conservation.",
                "capacity": 15,
                "ai_teaching_style": "guided",
            },
            {
                "name": "React & Next.js Developers",
                "subject": "Web Development",
                "description": "Building modern web apps, discussing React hooks, Server Components, and Tailwind CSS.",
                "capacity": 25,
                "ai_teaching_style": "direct",
            },
            {
                "name": "English Literature Club",
                "subject": "Literature",
                "description": "Reading and analyzing classic novels, poetry, and practicing critical essay writing.",
                "capacity": 10,
                "ai_teaching_style": "socratic",
            }
        ]

        created_count = 0
        for data in rooms_data:
            room, created = StudyRoom.objects.get_or_create(
                name=data["name"],
                defaults={
                    "subject": data["subject"],
                    "description": data["description"],
                    "created_by": admin_user,
                    "capacity": data["capacity"],
                    "ai_teaching_style": data["ai_teaching_style"],
                }
            )
            if created:
                created_count += 1
                self.stdout.write(self.style.SUCCESS(f'Successfully created room: {room.name}'))
            else:
                self.stdout.write(self.style.WARNING(f'Room already exists: {room.name}'))

        self.stdout.write(self.style.SUCCESS(f'\nFinished seeding rooms! Created {created_count} new rooms.'))
