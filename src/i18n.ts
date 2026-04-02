import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

const resources = {
  en: {
    translation: {
      "Who are you?": "Who are you?",
      "Student": "Student",
      "Teacher": "Teacher",
      "I already have an account": "I already have an account",
      "Class Code": "Class Code",
      "Name": "Name",
      "Surname": "Surname",
      "Email": "Email",
      "Password": "Password",
      "Continue": "Continue",
      "You registered as a teacher": "You registered as a teacher",
      "Your class code": "Your class code",
      "Home": "Home",
      "Extra Work": "Extra Work",
      "Shop": "Shop",
      "Settings": "Settings",
      "News": "News",
      "Timetable": "Timetable",
      "Students": "Students",
      "Logout": "Logout",
      "Stats": "Stats",
      "Leaderboard": "Leaderboard",
      "Grades": "Grades",
      "Points": "Points",
      "To Do": "To Do",
      "In Review": "In Review",
      "Completed": "Completed",
      "Give Assignment": "Give Assignment",
      "Review Assignments": "Review Assignments",
      "Pending": "Pending",
      "Bought": "Bought",
      "Theme": "Theme",
      "Language": "Language",
      "Avatar": "Avatar",
      "Change Password": "Change Password",
      "Present": "Present",
      "Late": "Late",
      "Absent": "Absent",
      "Grade": "Grade",
      "Give Points": "Give Points",
      "Create": "Create",
      "Title": "Title",
      "Description": "Description",
      "Price": "Price",
      "Absences": "Absences",
      "Reviews": "Reviews",
      "Assignments": "Assignments",
      "Leave Review": "Leave Review",
      "Write a review": "Write a review"
    }
  },
  ru: {
    translation: {
      "Who are you?": "Кто вы?",
      "Student": "Студент",
      "Teacher": "Учитель",
      "I already have an account": "У меня уже есть аккаунт",
      "Class Code": "Код класса",
      "Name": "Имя",
      "Surname": "Фамилия",
      "Email": "Email",
      "Password": "Пароль",
      "Continue": "Продолжить",
      "You registered as a teacher": "Вы зарегистрировались как учитель",
      "Your class code": "Ваш код класса",
      "Home": "Главная",
      "Extra Work": "Доп. задания",
      "Shop": "Магазин",
      "Settings": "Настройки",
      "News": "Новости",
      "Timetable": "Расписание",
      "Students": "Студенты",
      "Logout": "Выйти",
      "Stats": "Статистика",
      "Leaderboard": "Таблица лидеров",
      "Grades": "Оценки",
      "Points": "Баллы",
      "To Do": "На выполнение",
      "In Review": "На проверке",
      "Completed": "Выполненные",
      "Give Assignment": "Дать задание",
      "Review Assignments": "Проверить",
      "Pending": "В ожидании",
      "Bought": "Куплено",
      "Theme": "Тема",
      "Language": "Язык",
      "Avatar": "Аватарка",
      "Change Password": "Изменить пароль",
      "Present": "Присутствует",
      "Late": "Опоздал",
      "Absent": "Отсутствует",
      "Grade": "Оценка",
      "Give Points": "Дать баллы",
      "Create": "Создать",
      "Title": "Название",
      "Description": "Описание",
      "Price": "Цена",
      "Absences": "Пропуски",
      "Reviews": "Отзывы",
      "Assignments": "Задания",
      "Leave Review": "Оставить отзыв",
      "Write a review": "Написать отзыв"
    }
  }
};

i18n
  .use(initReactI18next)
  .init({
    resources,
    lng: "ru",
    fallbackLng: "en",
    interpolation: {
      escapeValue: false
    }
  });

export default i18n;
