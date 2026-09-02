import { useEffect, useRef } from 'react'
import { Toast } from 'primereact/toast'
import { notificationsAPI } from '../services/notificationsAPI'

export function NotificationsListener() {
  const toast = useRef<Toast>(null)

  useEffect(() => {
    const checkNotifications = async () => {
      try {
        const notifications = await notificationsAPI.getNotifications()

        notifications.forEach((notification) => {
          toast.current?.show({
            severity: 'info',
            summary: 'Nueva notificación',
            detail: notification.message,
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
  }, [])

  return <Toast ref={toast} position="top-right" />
}