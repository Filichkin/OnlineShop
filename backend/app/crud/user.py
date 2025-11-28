from typing import List, Optional

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.crud.base import CRUDBase
from app.models.user import User


class CRUDUser(CRUDBase):
    """CRUD operations for User model."""

    async def get_users_paginated(
        self,
        session: AsyncSession,
        skip: int = 0,
        limit: int = 20
    ) -> List[User]:
        """
        Get paginated list of users.

        Args:
            session: Database session
            skip: Number of records to skip
            limit: Maximum records to return

        Returns:
            List of users ordered by ID
        """
        result = await session.execute(
            select(User)
            .order_by(User.id)
            .offset(skip)
            .limit(limit)
        )
        return result.scalars().all()

    async def get_total_users_count(
        self,
        session: AsyncSession
    ) -> int:
        """
        Get total count of users in database.

        Args:
            session: Database session

        Returns:
            Total number of users
        """
        result = await session.execute(
            select(func.count(User.id))
        )
        return result.scalar_one()

    async def get_user_by_id(
        self,
        user_id: int,
        session: AsyncSession
    ) -> Optional[User]:
        """
        Get user by ID.

        Args:
            user_id: User ID
            session: Database session

        Returns:
            User object or None if not found
        """
        result = await session.execute(
            select(User).where(User.id == user_id)
        )
        return result.scalars().first()

    async def get_user_by_email(
        self,
        email: str,
        session: AsyncSession
    ) -> Optional[User]:
        """
        Get user by email.

        Args:
            email: User email
            session: Database session

        Returns:
            User object or None if not found
        """
        result = await session.execute(
            select(User).where(User.email == email)
        )
        return result.scalars().first()

    async def get_user_by_phone(
        self,
        phone: str,
        session: AsyncSession
    ) -> Optional[User]:
        """
        Get user by phone number.

        Args:
            phone: User phone number
            session: Database session

        Returns:
            User object or None if not found
        """
        result = await session.execute(
            select(User).where(User.phone == phone)
        )
        return result.scalars().first()

    async def get_user_by_telegram_id(
        self,
        telegram_id: str,
        session: AsyncSession
    ) -> Optional[User]:
        """
        Get user by Telegram ID.

        Args:
            telegram_id: User Telegram ID
            session: Database session

        Returns:
            User object or None if not found
        """
        result = await session.execute(
            select(User).where(User.telegram_id == telegram_id)
        )
        return result.scalars().first()

    async def update_user_fields(
        self,
        user: User,
        update_data: dict,
        session: AsyncSession
    ) -> User:
        """
        Update user fields with provided data.

        Updates only the fields present in update_data dictionary.
        Handles commit and refresh operations.

        Args:
            user: User object to update
            update_data: Dictionary with field names and new values
            session: Database session

        Returns:
            Updated user object

        Raises:
            Exception: If database commit fails
        """
        for field, value in update_data.items():
            setattr(user, field, value)

        await session.commit()
        await session.refresh(user)
        return user


user_crud = CRUDUser(User)
