import { useEffect, useRef } from 'react'
import { Toast } from 'primereact/toast'
import { useTranslation } from 'react-i18next'
import { notificationsAPI } from '../services/notificationsAPI'
import { useAppSelector } from '../store/hooks'

export function NotificationsListener() {
  const toast = useRef<Toast>(null)
  const { t } = useTranslation()
  const isAuthenticated = useAppSelector((state) => state.auth.isAuthenticated)

  useEffect(() => {
    if (!isAuthenticated) {
      return
    }

    const checkNotifications = async () => {
      try {
        const notifications = await notificationsAPI.getNotifications()

        notifications.forEach((notification) => {
          toast.current?.show({
            severity: 'info',
            summary: t('notifications_toast_title'),
            detail: t(`notification_${notification.type}`, notification.params),
            life: 5000,
          })
        })
      } catch {
        // No hacemos nada si el usuario no está autenticado
        // o si temporalmente no se puede consultar el endpoint.
      }
    }

    void checkNotifications()

    const interval = setInterval(() => {
      void checkNotifications()
    }, 1000)

    return () => {
      clearInterval(interval)
    }
  }, [isAuthenticated, t])

  return <Toast ref={toast} position="top-right" />
}